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
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan('context.input', JSON.stringify({
            aggregateType: input.aggregateType,
            aggregateId: input.aggregateId,
            aggregateVersion: input.aggregateVersion,
            eventType: input.event._tag,
          }));

          const dto: InsertOutboxEventDto = {
            aggregateType: input.aggregateType,
            aggregateId: input.aggregateId,
            aggregateVersion: input.aggregateVersion,
            eventType: input.event._tag,
            payload: input.event,
          };

          yield* Effect.tryPromise(async () => {
            await tx.insert(outboxEventsTable).values(dto);
          });

          yield* Effect.annotateCurrentSpan('context.output', 'no data');
        }).pipe(Effect.withSpan('OutboxRepository.insertWithinTransaction')),

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
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan('context.input', JSON.stringify({ eventId }));

          yield* Effect.tryPromise(async () => {
            await db
              .update(outboxEventsTable)
              .set({ processedAt: new Date() })
              .where(eq(outboxEventsTable.id, eventId));
          });

          yield* Effect.annotateCurrentSpan('context.output', 'no data');
        }).pipe(Effect.withSpan('OutboxRepository.markAsProcessed')),

      deleteOlderThan: (date) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan('context.input', JSON.stringify({
            olderThan: date.toISOString(),
          }));

          const result = yield* Effect.tryPromise(async () => {
            const res = await db
              .delete(outboxEventsTable)
              .where(lt(outboxEventsTable.processedAt, date));
            return res.rowCount ?? 0;
          });

          yield* Effect.annotateCurrentSpan('context.output', JSON.stringify({
            deletedCount: result,
          }));

          return result;
        }).pipe(Effect.withSpan('OutboxRepository.deleteOlderThan')),
    };
  }),
);

/**
 * In-memory implementation for testing.
 * Stores events in memory and allows inspection for test assertions.
 */
export type InMemoryOutboxRepositoryState = {
  readonly getStoredEvents: () => ReadonlyArray<SelectOutboxEventDto>;
  readonly clear: () => void;
};

export const makeInMemoryOutboxRepository = (): {
  repository: Context.Tag.Service<OutboxRepository>;
  state: InMemoryOutboxRepositoryState;
} => {
  const events = new Map<string, SelectOutboxEventDto>();

  const repository: Context.Tag.Service<OutboxRepository> = {
    insertWithinTransaction: (_tx, input) =>
      Effect.sync(() => {
        const id = crypto.randomUUID();
        const now = new Date();
        const event: SelectOutboxEventDto = {
          id,
          aggregateType: input.aggregateType,
          aggregateId: input.aggregateId,
          aggregateVersion: input.aggregateVersion,
          eventType: input.event._tag,
          payload: input.event,
          createdAt: now,
          processedAt: null,
        };
        events.set(id, event);
      }),

    findUnprocessed: (limit) =>
      Effect.sync(() => {
        const unprocessed = Array.from(events.values())
          .filter((e) => e.processedAt === null)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .slice(0, limit);
        return unprocessed;
      }),

    markAsProcessed: (eventId) =>
      Effect.sync(() => {
        const event = events.get(eventId);
        if (event) {
          events.set(eventId, { ...event, processedAt: new Date() });
        }
      }),

    deleteOlderThan: (date) =>
      Effect.sync(() => {
        let count = 0;
        for (const [id, event] of events) {
          if (event.processedAt && event.processedAt < date) {
            events.delete(id);
            count++;
          }
        }
        return count;
      }),
  };

  const state: InMemoryOutboxRepositoryState = {
    getStoredEvents: () => Array.from(events.values()),
    clear: () => events.clear(),
  };

  return { repository, state };
};

/**
 * Simple in-memory layer for tests that don't need to inspect events.
 */
export const InMemoryOutboxRepository = Layer.sync(OutboxRepository, () => {
  const { repository } = makeInMemoryOutboxRepository();
  return repository;
});
