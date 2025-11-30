import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Context, Effect, Option, Schema } from 'effect';
import {
  EndedGameEntity,
  GameEntity,
  isNotStartedGame,
  isStartedGame,
  NotStartedGameEntity,
  StartedGameEntity,
  StartedGameSnapshot,
} from 'src/game/game.entity.js';
import { GameRepository, OptimisticConcurrencyError } from 'src/game/game.repository.js';
import {
  EndedGameSnapshotSchema,
  NotStartedGameSnapshotSchema,
  StartedGameSnapshotSchema,
} from 'src/game/game-snapshot.schema.js';
import { gamesTable } from 'src/infra/db/schema.js';

export const makeDrizzleGameRepository = ({
  db,
}: {
  db: NodePgDatabase<Record<string, never>>;
}): Context.Tag.Service<GameRepository> => {
  return {
    save: (game: GameEntity) => {
      return Effect.gen(function* () {
        const now = new Date();
        const snapshot = game.toSnapshot();

        // Encode the snapshot to JSONB-compatible format
        // This transforms Maps to objects and validates the snapshot structure
        let encodedSnapshot;
        if (isNotStartedGame(game)) {
          encodedSnapshot = yield* Schema.encodeUnknown(NotStartedGameSnapshotSchema)(snapshot);
        } else if (isStartedGame(game)) {
          encodedSnapshot = yield* Schema.encodeUnknown(StartedGameSnapshotSchema)(snapshot);
        } else {
          encodedSnapshot = yield* Schema.encodeUnknown(EndedGameSnapshotSchema)(snapshot);
        }

        // Insert/update in database
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
                data: encodedSnapshot,
                version: snapshot.version,
              })
              .onConflictDoUpdate({
                target: gamesTable.id,
                set: {
                  data: encodedSnapshot,
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
                data: encodedSnapshot,
                version: snapshot.version,
              })
              .onConflictDoUpdate({
                target: gamesTable.id,
                set: {
                  data: encodedSnapshot,
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
              data: encodedSnapshot,
              version: snapshot.version,
            })
            .onConflictDoUpdate({
              target: gamesTable.id,
              set: {
                data: encodedSnapshot,
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
          const snapshot = yield* Schema.decodeUnknown(NotStartedGameSnapshotSchema)(row.data);
          return Option.some(NotStartedGameEntity.fromSnapshot(snapshot));
        }

        if (row.status === 'StartedGame') {
          // Decode from JSONB format - this automatically converts objects to Maps
          const snapshot = yield* Schema.decodeUnknown(StartedGameSnapshotSchema)(row.data);
          // Schema.Map decodes to a Map, but we need to ensure nested Maps are proper Map instances
          const snapshotWithMap = {
            ...snapshot,
            currentTurn: {
              ...snapshot.currentTurn,
              pointsByPlayer: snapshot.currentTurn.pointsByPlayer instanceof Map
                ? snapshot.currentTurn.pointsByPlayer
                : new Map(Object.entries(snapshot.currentTurn.pointsByPlayer)),
            },
          };
          // Cast to remove readonly modifiers - the schema returns readonly types for safety
          return Option.some(StartedGameEntity.fromSnapshot(snapshotWithMap as unknown as Omit<StartedGameSnapshot, 'status'>));
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

        const snapshot = yield* Schema.decodeUnknown(NotStartedGameSnapshotSchema)(result[0].data);
        return Option.some(NotStartedGameEntity.fromSnapshot(snapshot));
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

        // Decode from JSONB format - this automatically converts objects to Maps
        const snapshot = yield* Schema.decodeUnknown(StartedGameSnapshotSchema)(result[0].data);
        // Schema.Map decodes to a Map, but we need to ensure nested Maps are proper Map instances
        const snapshotWithMap = {
          ...snapshot,
          currentTurn: {
            ...snapshot.currentTurn,
            pointsByPlayer: snapshot.currentTurn.pointsByPlayer instanceof Map
              ? snapshot.currentTurn.pointsByPlayer
              : new Map(Object.entries(snapshot.currentTurn.pointsByPlayer)),
          },
        };
        // Cast to remove readonly modifiers - the schema returns readonly types for safety
        return Option.some(StartedGameEntity.fromSnapshot(snapshotWithMap as unknown as Omit<StartedGameSnapshot, 'status'>));
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

        const snapshot = yield* Schema.decodeUnknown(EndedGameSnapshotSchema)(result[0].data);
        return Option.some(EndedGameEntity.fromSnapshot(snapshot));
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
