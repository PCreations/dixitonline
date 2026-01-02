import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Context, Effect, Layer, Option, ParseResult, Schema } from 'effect';
import { Database } from '../../../infra/db/database.service.js';
import { gamesTable, outboxEventsTable } from '../../../infra/db/schema.js';
import {
  EndedGameEntity,
  GameEntity,
  isNotStartedGame,
  isStartedGame,
  NotStartedGameEntity,
  StartedGameEntity,
  StartedGameSnapshot,
} from '../../game.entity.js';
import {
  DatabaseError,
  GameRepository,
  OptimisticConcurrencyError,
} from '../../game.repository.js';
import type { GameEvent } from '../../game-events.js';
import {
  EndedGameSnapshotSchema,
  NotStartedGameSnapshotSchema,
  StartedGameSnapshotSchema,
} from '../../game-snapshot.schema.js';

// Helper to wrap database errors with proper cause chain
const toDatabaseError = (error: unknown): DatabaseError =>
  new DatabaseError({
    message: error instanceof Error ? error.message : String(error),
    cause: error,
  });

export const makeDrizzleGameRepository = ({
  db,
}: {
  db: NodePgDatabase<Record<string, never>>;
}): Context.Tag.Service<GameRepository> => {
  type GameStatus = 'NotStartedGame' | 'StartedGame' | 'EndedGame';
  type EncodedGameData = {
    snapshot: ReturnType<GameEntity['toSnapshot']>;
    encoded: (typeof gamesTable.$inferInsert)['data'];
    status: GameStatus;
  };

  // Helper to encode a game snapshot for database storage
  const encodeGameSnapshot = (
    game: GameEntity,
  ): Effect.Effect<EncodedGameData, ParseResult.ParseError> =>
    Effect.gen(function* () {
      const snapshot = game.toSnapshot();
      if (isNotStartedGame(game)) {
        const encoded = yield* Schema.encodeUnknown(
          NotStartedGameSnapshotSchema,
        )(snapshot);
        return { snapshot, encoded, status: 'NotStartedGame' as const };
      }
      if (isStartedGame(game)) {
        const encoded = yield* Schema.encodeUnknown(StartedGameSnapshotSchema)(
          snapshot,
        );
        return { snapshot, encoded, status: 'StartedGame' as const };
      }
      const encoded = yield* Schema.encodeUnknown(EndedGameSnapshotSchema)(
        snapshot,
      );
      return { snapshot, encoded, status: 'EndedGame' as const };
    });

  // Helper to perform the actual save operation (works with db or tx)
  const saveGameToDb = async (
    client: NodePgDatabase<Record<string, never>>,
    game: GameEntity,
    encodedData: EncodedGameData,
  ) => {
    const now = new Date();
    const { snapshot, encoded, status } = encodedData;

    return await client
      .insert(gamesTable)
      .values({
        id: snapshot.id,
        createdAt: now,
        updatedAt: now,
        status,
        data: encoded,
        version: snapshot.version,
      })
      .onConflictDoUpdate({
        target: gamesTable.id,
        set: {
          data: encoded,
          status,
          version: snapshot.version,
          updatedAt: now,
        },
        where: eq(gamesTable.version, game.version - 1),
      });
  };

  return {
    save: (game: GameEntity) => {
      return Effect.gen(function* () {
        const encodedData = yield* encodeGameSnapshot(game);

        const result = yield* Effect.tryPromise({
          try: () => saveGameToDb(db, game, encodedData),
          catch: toDatabaseError,
        });

        // Check if update was successful (affected rows)
        // When onConflictDoUpdate WHERE clause doesn't match any rows (version mismatch),
        // rowCount will be 0, indicating an optimistic concurrency conflict
        if (result.rowCount === 0) {
          return yield* Effect.fail(new OptimisticConcurrencyError());
        }

        return yield* Effect.void;
      }).pipe(
        Effect.withSpan('GameRepository.save', {
          attributes: { 'game.id': game.id },
        }),
      );
    },

    saveWithEvents: (game: GameEntity, events: ReadonlyArray<GameEvent>) => {
      return Effect.gen(function* () {
        const encodedData = yield* encodeGameSnapshot(game);

        const result = yield* Effect.tryPromise({
          try: async () => {
            return await db.transaction(async (tx) => {
              // 1. Save the game
              const saveResult = await saveGameToDb(tx, game, encodedData);

              // Check optimistic concurrency before inserting events
              if (saveResult.rowCount === 0) {
                // Rollback will happen automatically when we throw
                throw new OptimisticConcurrencyError();
              }

              // 2. Insert events into outbox
              if (events.length > 0) {
                const outboxEvents = events.map((event) => ({
                  aggregateType: 'game' as const,
                  aggregateId: game.id,
                  aggregateVersion: game.version,
                  eventType: event._tag,
                  payload: event,
                }));

                await tx.insert(outboxEventsTable).values(outboxEvents);
              }

              return saveResult;
            });
          },
          catch: (error) =>
            error instanceof OptimisticConcurrencyError
              ? error
              : toDatabaseError(error),
        });

        // The transaction already checked for optimistic concurrency
        // If we got here, the save was successful
        if (result instanceof OptimisticConcurrencyError) {
          return yield* Effect.fail(result);
        }

        return yield* Effect.void;
      }).pipe(
        Effect.withSpan('GameRepository.saveWithEvents', {
          attributes: {
            'game.id': game.id,
            'events.count': events.length,
          },
        }),
      );
    },
    findById: (id: string) => {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: async () => {
            return await db
              .select()
              .from(gamesTable)
              .where(eq(gamesTable.id, id))
              .limit(1);
          },
          catch: toDatabaseError,
        });

        if (result.length === 0) {
          return Option.none();
        }

        const row = result[0];

        if (row.status === 'NotStartedGame') {
          const snapshot = yield* Schema.decodeUnknown(
            NotStartedGameSnapshotSchema,
          )(row.data);
          return Option.some(NotStartedGameEntity.fromSnapshot(snapshot));
        }

        if (row.status === 'StartedGame') {
          // Decode from JSONB format - this automatically converts objects to Maps
          const snapshot = yield* Schema.decodeUnknown(
            StartedGameSnapshotSchema,
          )(row.data);
          // Schema.Map decodes to a Map, but we need to ensure nested Maps are proper Map instances
          const snapshotWithMap = {
            ...snapshot,
            currentTurn: {
              ...snapshot.currentTurn,
              pointsByPlayer:
                snapshot.currentTurn.pointsByPlayer instanceof Map
                  ? snapshot.currentTurn.pointsByPlayer
                  : new Map(
                      Object.entries(snapshot.currentTurn.pointsByPlayer),
                    ),
            },
          };
          // Cast to remove readonly modifiers - the schema returns readonly types for safety
          return Option.some(
            StartedGameEntity.fromSnapshot(
              snapshotWithMap as unknown as Omit<StartedGameSnapshot, 'status'>,
            ),
          );
        }

        return Option.none();
      }).pipe(
        Effect.withSpan('GameRepository.findById', {
          attributes: { 'game.id': id },
        }),
      );
    },
    findNotStartedGameById: (id: string) => {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: async () => {
            return await db
              .select()
              .from(gamesTable)
              .where(eq(gamesTable.id, id))
              .limit(1);
          },
          catch: toDatabaseError,
        });

        if (result.length === 0 || result[0].status !== 'NotStartedGame') {
          return Option.none();
        }

        const snapshot = yield* Schema.decodeUnknown(
          NotStartedGameSnapshotSchema,
        )(result[0].data);
        return Option.some(NotStartedGameEntity.fromSnapshot(snapshot));
      }).pipe(
        Effect.withSpan('GameRepository.findNotStartedGameById', {
          attributes: { 'game.id': id },
        }),
      );
    },
    findStartedGameById: (id: string) => {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: async () => {
            return await db
              .select()
              .from(gamesTable)
              .where(eq(gamesTable.id, id))
              .limit(1);
          },
          catch: toDatabaseError,
        });

        if (result.length === 0 || result[0].status !== 'StartedGame') {
          return Option.none();
        }

        // Decode from JSONB format - this automatically converts objects to Maps
        const snapshot = yield* Schema.decodeUnknown(StartedGameSnapshotSchema)(
          result[0].data,
        );
        // Schema.Map decodes to a Map, but we need to ensure nested Maps are proper Map instances
        const snapshotWithMap = {
          ...snapshot,
          currentTurn: {
            ...snapshot.currentTurn,
            pointsByPlayer:
              snapshot.currentTurn.pointsByPlayer instanceof Map
                ? snapshot.currentTurn.pointsByPlayer
                : new Map(Object.entries(snapshot.currentTurn.pointsByPlayer)),
          },
        };
        // Cast to remove readonly modifiers - the schema returns readonly types for safety
        return Option.some(
          StartedGameEntity.fromSnapshot(
            snapshotWithMap as unknown as Omit<StartedGameSnapshot, 'status'>,
          ),
        );
      }).pipe(
        Effect.withSpan('GameRepository.findStartedGameById', {
          attributes: { 'game.id': id },
        }),
      );
    },
    findEndedGameById: (id: string) => {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: async () => {
            return await db
              .select()
              .from(gamesTable)
              .where(eq(gamesTable.id, id))
              .limit(1);
          },
          catch: toDatabaseError,
        });

        if (result.length === 0 || result[0].status !== 'EndedGame') {
          return Option.none();
        }

        const snapshot = yield* Schema.decodeUnknown(EndedGameSnapshotSchema)(
          result[0].data,
        );
        return Option.some(EndedGameEntity.fromSnapshot(snapshot));
      }).pipe(
        Effect.withSpan('GameRepository.findEndedGameById', {
          attributes: { 'game.id': id },
        }),
      );
    },
    isPlayerInGame: (gameId: string, playerId: string) => {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: async () => {
            return await db
              .select()
              .from(gamesTable)
              .where(eq(gamesTable.id, gameId))
              .limit(1);
          },
          catch: toDatabaseError,
        });

        if (result.length === 0) {
          return false;
        }

        const game = result[0];
        return game.data.players.includes(playerId);
      }).pipe(
        Effect.withSpan('GameRepository.isPlayerInGame', {
          attributes: { 'game.id': gameId, 'player.id': playerId },
        }),
      );
    },
    simulateStaleRead: () => Effect.void,
  };
};

/**
 * DrizzleGameRepository Layer that depends on Database service
 */
export const DrizzleGameRepository = Layer.effect(
  GameRepository,
  Effect.gen(function* () {
    const { db } = yield* Database;
    return makeDrizzleGameRepository({ db });
  }),
);
