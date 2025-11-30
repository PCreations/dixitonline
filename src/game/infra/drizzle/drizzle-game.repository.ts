import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Context, Effect, Option } from 'effect';
import {
  EndedGameEntity,
  EndedGameSnapshot,
  GameEntity,
  isNotStartedGame,
  isStartedGame,
  NotStartedGameEntity,
  NotStartedGameSnapshot,
  StartedGameEntity,
  StartedGameSnapshot,
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

        const result = yield* Effect.tryPromise(async () => {
          // Always use onConflictDoUpdate to handle both new games and updates
          // For version 1 with no existing row: INSERT succeeds
          // For version 1 with existing row (same version conflict): WHERE version = 0 won't match → rowCount = 0
          // For version > 1: UPDATE only if WHERE version = game.version - 1 matches → rowCount = 0 if version mismatch

          if (isNotStartedGame(game)) {
            return await db
              .insert(gamesTable)
              .values({
                id: snapshot.id,
                createdAt: now,
                updatedAt: now,
                status: 'NotStartedGame',
                data: snapshot,
                version: snapshot.version,
              })
              .onConflictDoUpdate({
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
            return await db
              .insert(gamesTable)
              .values({
                id: snapshot.id,
                createdAt: now,
                updatedAt: now,
                status: 'StartedGame',
                data: snapshot,
                version: snapshot.version,
              })
              .onConflictDoUpdate({
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
          return await db
            .insert(gamesTable)
            .values({
              id: snapshot.id,
              createdAt: now,
              updatedAt: now,
              status: 'EndedGame',
              data: snapshot,
              version: snapshot.version,
            })
            .onConflictDoUpdate({
              target: gamesTable.id,
              set: {
                data: snapshot,
                status: 'EndedGame',
                version: snapshot.version,
                updatedAt: now,
              },
              where: eq(gamesTable.version, game.version - 1),
            });
        });

        // Check if update was successful (affected rows)
        // When onConflictDoUpdate WHERE clause doesn't match any rows (version mismatch),
        // rowCount will be 0, indicating an optimistic concurrency conflict
        if (result.rowCount === 0) {
          return yield* Effect.fail(new OptimisticConcurrencyError());
        }

        return yield* Effect.void;
      });
    },
    findById: (id: string) => {
      return Effect.gen(function* () {
        const result = yield* Effect.promise(async () => {
          return await db
            .select()
            .from(gamesTable)
            .where(eq(gamesTable.id, id))
            .limit(1);
        });

        if (result.length === 0) {
          return Option.none();
        }

        const row = result[0];

        if (row.status === 'NotStartedGame') {
          return Option.some(NotStartedGameEntity.fromSnapshot(row.data as NotStartedGameSnapshot));
        }

        if (row.status === 'StartedGame') {
          const snapshot = row.data as StartedGameSnapshot;
          // Convert pointsByPlayer from JSONB object to Map-compatible format
          // JSONB stores Maps as objects, so we need to convert back to entries array
          const normalizedSnapshot = {
            ...snapshot,
            currentTurn: {
              ...snapshot.currentTurn,
              pointsByPlayer: Object.entries(snapshot.currentTurn.pointsByPlayer),
            },
          } as unknown as Omit<StartedGameSnapshot, 'status'>;
          return Option.some(StartedGameEntity.fromSnapshot(normalizedSnapshot));
        }

        return Option.none();
      });
    },
    findNotStartedGameById: (id: string) => {
      return Effect.gen(function* () {
        const result = yield* Effect.promise(async () => {
          return await db
            .select()
            .from(gamesTable)
            .where(eq(gamesTable.id, id))
            .limit(1);
        });

        if (result.length === 0 || result[0].status !== 'NotStartedGame') {
          return Option.none();
        }

        return Option.some(NotStartedGameEntity.fromSnapshot(result[0].data as NotStartedGameSnapshot));
      });
    },
    findStartedGameById: (id: string) => {
      return Effect.gen(function* () {
        const result = yield* Effect.promise(async () => {
          return await db
            .select()
            .from(gamesTable)
            .where(eq(gamesTable.id, id))
            .limit(1);
        });

        if (result.length === 0 || result[0].status !== 'StartedGame') {
          return Option.none();
        }

        const snapshot = result[0].data as StartedGameSnapshot;
        // Convert pointsByPlayer from JSONB object to Map-compatible format
        // JSONB stores Maps as objects, so we need to convert back to entries array
        const normalizedSnapshot = {
          ...snapshot,
          currentTurn: {
            ...snapshot.currentTurn,
            pointsByPlayer: Object.entries(snapshot.currentTurn.pointsByPlayer),
          },
        } as unknown as Omit<StartedGameSnapshot, 'status'>;
        return Option.some(StartedGameEntity.fromSnapshot(normalizedSnapshot));
      });
    },
    findEndedGameById: (id: string) => {
      return Effect.gen(function* () {
        const result = yield* Effect.promise(async () => {
          return await db
            .select()
            .from(gamesTable)
            .where(eq(gamesTable.id, id))
            .limit(1);
        });

        if (result.length === 0 || result[0].status !== 'EndedGame') {
          return Option.none();
        }

        return Option.some(EndedGameEntity.fromSnapshot(result[0].data as EndedGameSnapshot));
      });
    },
    isPlayerInGame: (gameId: string, playerId: string) => {
      return Effect.gen(function* () {
        const result = yield* Effect.promise(async () => {
          return await db
            .select()
            .from(gamesTable)
            .where(eq(gamesTable.id, gameId))
            .limit(1);
        });

        if (result.length === 0) {
          return false;
        }

        const game = result[0];
        return game.data.players.includes(playerId);
      });
    },
    simulateStaleRead: () => Effect.void,
  };
};
