import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Context, Effect, Option } from 'effect';
import {
  GameEntity,
  isNotStartedGame,
  isStartedGame,
} from 'src/game/game.entity.js';
import { GameRepository, OptimisticConcurrencyError } from 'src/game/game.repository.js';
import { gamesTable } from 'src/infra/db/schema.js';

export const makeDrizzleGameRepository = ({
  db,
}: {
  db: NodePgDatabase<Record<string, never>>;
}): Context.Tag.Service<GameRepository> => {
  return {
    save: (game: GameEntity) => {
      return Effect.gen(function* () {
        const snapshot = game.toSnapshot();
        const now = new Date()

        const result = yield* Effect.tryPromise({
          try: async () => {
            // For new games (version 1), just insert without conflict handling
            // For updates (version > 1), use onConflictDoUpdate with version check
            const isNewGame = snapshot.version === 1;

            if (isNotStartedGame(game)) {
              const query = db
                .insert(gamesTable)
                .values({
                  id: snapshot.id,
                  createdAt: now,
                  updatedAt: now,
                  status: 'NotStartedGame',
                  data: snapshot,
                  version: snapshot.version,
                });

              return isNewGame
                ? await query
                : await query.onConflictDoUpdate({
                    target: gamesTable.id,
                    set: {
                      data: snapshot,
                      status: 'NotStartedGame',
                      version: snapshot.version,
                      updatedAt: now,
                    },
                    where: eq(gamesTable.version, game.version - 1),
                  });
            }

            if (isStartedGame(game)) {
              const query = db
                .insert(gamesTable)
                .values({
                  id: snapshot.id,
                  createdAt: now,
                  updatedAt: now,
                  status: 'StartedGame',
                  data: snapshot,
                  version: snapshot.version,
                });

              return isNewGame
                ? await query
                : await query.onConflictDoUpdate({
                    target: gamesTable.id,
                    set: {
                      data: snapshot,
                      status: 'StartedGame',
                      version: snapshot.version,
                      updatedAt: now,
                    },
                    where: eq(gamesTable.version, game.version - 1),
                  });
            }

            // EndedGame
            const query = db
              .insert(gamesTable)
              .values({
                id: snapshot.id,
                createdAt: now,
                updatedAt: now,
                status: 'EndedGame',
                data: snapshot,
                version: snapshot.version,
              });

            return isNewGame
              ? await query
              : await query.onConflictDoUpdate({
                  target: gamesTable.id,
                  set: {
                    data: snapshot,
                    status: 'EndedGame',
                    version: snapshot.version,
                    updatedAt: now,
                  },
                  where: eq(gamesTable.version, game.version - 1),
                });
          },
          catch: () => new OptimisticConcurrencyError(),
        });

        // Check if update was successful (affected rows)
        if (result.rowCount === 0) {
          return yield* Effect.fail(new OptimisticConcurrencyError());
        }

        return yield* Effect.void;
      });
    },
    findById: () => Effect.succeed(Option.none()),
    findNotStartedGameById: () => Effect.succeed(Option.none()),
    findStartedGameById: () => Effect.succeed(Option.none()),
    findEndedGameById: () => Effect.succeed(Option.none()),
    isPlayerInGame: () => Effect.succeed(false),
    simulateStaleRead: () => Effect.void,
  };
};
