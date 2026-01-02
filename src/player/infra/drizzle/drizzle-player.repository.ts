import { eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Context } from 'effect';
import { Effect, Layer, Option, Schema } from 'effect';
import { Database } from '../../../infra/db/database.service.js';
import { playersTable } from '../../../infra/db/schema.js';
import { PlayerEntity, PlayerId } from '../../player.entity.js';
import {
  DatabaseError,
  OptimisticConcurrencyError,
  PlayerRepository,
} from '../../player.repository.js';
import { PlayerSnapshotSchema } from '../../player-snapshot.schema.js';

// Helper to wrap database errors with proper cause chain
const toDatabaseError = (error: unknown): DatabaseError =>
  new DatabaseError({
    message: error instanceof Error ? error.message : String(error),
    cause: error,
  });

export const makeDrizzlePlayerRepository = ({
  db,
}: {
  db: NodePgDatabase<Record<string, never>>;
}): Context.Tag.Service<PlayerRepository> => {
  return {
    findById: (id: PlayerId) => {
      return Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: async () => {
            return await db
              .select()
              .from(playersTable)
              .where(eq(playersTable.id, id))
              .limit(1);
          },
          catch: toDatabaseError,
        });

        if (result.length === 0) {
          return Option.none();
        }

        const row = result[0];

        // Decode and validate the row data using Schema
        const snapshot = yield* Schema.decodeUnknown(PlayerSnapshotSchema)({
          id: row.id,
          username: row.username,
          email: row.email,
          isAnonymous: row.isAnonymous,
          version: row.version,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        });

        return Option.some(PlayerEntity.fromSnapshot(snapshot));
      }).pipe(
        Effect.withSpan('PlayerRepository.findById', {
          attributes: { 'player.id': id },
        }),
      );
    },

    findByIds: (ids: ReadonlyArray<PlayerId>) => {
      return Effect.gen(function* () {
        if (ids.length === 0) {
          return new Map() as ReadonlyMap<PlayerId, PlayerEntity>;
        }

        const result = yield* Effect.tryPromise({
          try: async () => {
            return await db
              .select()
              .from(playersTable)
              .where(inArray(playersTable.id, [...ids] as Array<string>));
          },
          catch: toDatabaseError,
        });

        const playerMap = new Map<PlayerId, PlayerEntity>();
        for (const row of result) {
          // Decode and validate each row
          const snapshot = yield* Schema.decodeUnknown(PlayerSnapshotSchema)({
            id: row.id,
            username: row.username,
            email: row.email,
            isAnonymous: row.isAnonymous,
            version: row.version,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          });

          const player = PlayerEntity.fromSnapshot(snapshot);
          playerMap.set(PlayerId(row.id), player);
        }

        return playerMap as ReadonlyMap<PlayerId, PlayerEntity>;
      }).pipe(
        Effect.withSpan('PlayerRepository.findByIds', {
          attributes: { 'player.ids.count': ids.length },
        }),
      );
    },

    // save with optimistic concurrency control
    save: (player: PlayerEntity) => {
      return Effect.gen(function* () {
        const snapshot = player.toSnapshot();

        // Validate the snapshot structure before saving
        yield* Schema.decodeUnknown(PlayerSnapshotSchema)(snapshot);

        // Insert/update with optimistic concurrency control
        // For version 1 (new player): INSERT succeeds
        // For version > 1: UPDATE only if WHERE version = player.version - 1 matches
        const result = yield* Effect.tryPromise({
          try: async () => {
            return await db
              .insert(playersTable)
              .values({
                id: snapshot.id,
                username: snapshot.username,
                email: snapshot.email,
                isAnonymous: snapshot.isAnonymous,
                version: snapshot.version,
                createdAt: snapshot.createdAt,
                updatedAt: snapshot.updatedAt,
              })
              .onConflictDoUpdate({
                target: playersTable.id,
                set: {
                  username: snapshot.username,
                  email: snapshot.email,
                  isAnonymous: snapshot.isAnonymous,
                  version: snapshot.version,
                  updatedAt: snapshot.updatedAt,
                },
                where: eq(playersTable.version, player.version - 1),
              });
          },
          catch: toDatabaseError,
        });

        // Check if update was successful (affected rows)
        // When onConflictDoUpdate WHERE clause doesn't match any rows (version mismatch),
        // rowCount will be 0, indicating an optimistic concurrency conflict
        if (result.rowCount === 0) {
          return yield* Effect.fail(
            new OptimisticConcurrencyError({ playerId: player.id }),
          );
        }

        return yield* Effect.void;
      }).pipe(
        Effect.withSpan('PlayerRepository.save', {
          attributes: { 'player.id': player.id },
        }),
      );
    },
  };
};

/**
 * DrizzlePlayerRepository Layer that depends on Database service
 */
export const DrizzlePlayerRepository = Layer.effect(
  PlayerRepository,
  Effect.gen(function* () {
    const { db } = yield* Database;
    return makeDrizzlePlayerRepository({ db });
  }),
);
