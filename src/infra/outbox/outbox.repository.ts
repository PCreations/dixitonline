import { eq, isNull, lt } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Context, Effect, Layer } from 'effect';
import { UnknownException } from 'effect/Cause';
import type { GameEvent } from '../../game/game-event-bus.js';
import { Database } from '../db/database.service.js';
import {
  type InsertOutboxEventDto,
  outboxEventsTable,
  type SelectOutboxEventDto,
} from '../db/schema.js';

/**
 * Input for inserting an outbox event within a transaction.
 */
export type OutboxEventInput = {
  readonly aggregateType: 'game' | 'player';
  readonly aggregateId: string;
  readonly aggregateVersion: number;
  readonly event: GameEvent;
};

/**
 * Repository for the outbox_events table.
 * Provides methods for inserting events within transactions,
 * querying unprocessed events, and cleanup.
 */
export class OutboxRepository extends Context.Tag('OutboxRepository')<
  OutboxRepository,
  {
    /**
     * Insert an event into the outbox within an existing transaction.
     * This should be called in the same transaction as the aggregate save.
     */
    readonly insertWithinTransaction: (
      tx: NodePgDatabase<Record<string, never>>,
      input: OutboxEventInput,
    ) => Effect.Effect<void, UnknownException>;

    /**
     * Find unprocessed events (processedAt is null), ordered by createdAt.
     * Used by the polling daemon to catch up on missed events.
     */
    readonly findUnprocessed: (
      limit: number,
    ) => Effect.Effect<ReadonlyArray<SelectOutboxEventDto>, UnknownException>;

    /**
     * Mark an event as processed by setting processedAt to now.
     */
    readonly markAsProcessed: (
      eventId: string,
    ) => Effect.Effect<void, UnknownException>;

    /**
     * Delete events older than the given date.
     * Used for cleanup of old processed events.
     */
    readonly deleteOlderThan: (
      date: Date,
    ) => Effect.Effect<number, UnknownException>;
  }
>() {}

/**
 * Drizzle implementation of OutboxRepository.
 */
export const DrizzleOutboxRepository = Layer.effect(
  OutboxRepository,
  Effect.gen(function* () {
    const { db } = yield* Database;

    return {
      insertWithinTransaction: (tx, input) =>
        Effect.tryPromise(async () => {
          const dto: InsertOutboxEventDto = {
            aggregateType: input.aggregateType,
            aggregateId: input.aggregateId,
            aggregateVersion: input.aggregateVersion,
            eventType: input.event._tag,
            payload: input.event,
          };

          await tx.insert(outboxEventsTable).values(dto);
        }),

      findUnprocessed: (limit) =>
        Effect.tryPromise(async () => {
          return await db
            .select()
            .from(outboxEventsTable)
            .where(isNull(outboxEventsTable.processedAt))
            .orderBy(outboxEventsTable.createdAt)
            .limit(limit);
        }),

      markAsProcessed: (eventId) =>
        Effect.tryPromise(async () => {
          await db
            .update(outboxEventsTable)
            .set({ processedAt: new Date() })
            .where(eq(outboxEventsTable.id, eventId));
        }),

      deleteOlderThan: (date) =>
        Effect.tryPromise(async () => {
          const result = await db
            .delete(outboxEventsTable)
            .where(lt(outboxEventsTable.processedAt, date));

          return result.rowCount ?? 0;
        }),
    };
  }),
);

/**
 * In-memory implementation for testing.
 */
export const InMemoryOutboxRepository = Layer.succeed(OutboxRepository, {
  insertWithinTransaction: () =>
    Effect.void as Effect.Effect<void, UnknownException>,
  findUnprocessed: () =>
    Effect.succeed([]) as Effect.Effect<
      ReadonlyArray<SelectOutboxEventDto>,
      UnknownException
    >,
  markAsProcessed: () => Effect.void as Effect.Effect<void, UnknownException>,
  deleteOlderThan: () =>
    Effect.succeed(0) as Effect.Effect<number, UnknownException>,
});
