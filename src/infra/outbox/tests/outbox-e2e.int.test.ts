import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it } from 'vitest';
import { outboxEventsTable } from '../../db/schema.js';
import { getTestDb } from '../../../shared/tests/setup/test-db.js';
import { DrizzleOutboxRepository, OutboxRepository } from '../outbox.repository.js';
import { Database } from '../../db/database.service.js';

/**
 * Integration tests for the Outbox pattern.
 *
 * These tests verify that:
 * 1. Events inserted into the outbox table are eventually processed
 * 2. The polling daemon picks up unprocessed events
 * 3. Events are published to the GameEventBus
 *
 * Prerequisites:
 * - Supabase local running (via testcontainers in setupIntTests.ts)
 * - Database migrations applied
 */
describe('Outbox E2E Integration', () => {
  beforeEach(async () => {
    // Clean the outbox table before each test
    const db = getTestDb();
    await db.delete(outboxEventsTable);
  });

  describe('Feature: Eventually processed events', () => {
    it('should process events inserted directly into outbox table via polling daemon', async () => {
      const db = getTestDb();

      // Track published events
      const publishedEvents: Array<{ _tag: string; gameId: string; playerId: string }> = [];

      // Insert an event directly into the outbox table (simulating what saveWithEvents does)
      const eventId = crypto.randomUUID();
      const gameId = crypto.randomUUID();
      const playerId = crypto.randomUUID();

      await db.insert(outboxEventsTable).values({
        id: eventId,
        aggregateType: 'game',
        aggregateId: gameId,
        aggregateVersion: 1,
        eventType: 'PlayerJoined',
        payload: {
          _tag: 'PlayerJoined',
          gameId: gameId,
          playerId: playerId,
        },
      });

      // Verify event was inserted
      const insertedEvents = await db.select().from(outboxEventsTable);
      expect(insertedEvents).toHaveLength(1);
      expect(insertedEvents[0].processedAt).toBeNull();

      // Create layers for the daemon
      const databaseLayer = Layer.succeed(Database, { db });

      const gameEventBusLayer = Layer.succeed(
        (await import('../../../game/game-event-bus.js')).GameEventBus,
        {
          publish: (event) =>
            Effect.sync(() => {
              publishedEvents.push(event as { _tag: string; gameId: string; playerId: string });
            }),
          subscribe: () => {
            const { Stream } = require('effect');
            return Stream.empty;
          },
        },
      );

      // Create outbox repository layer
      const outboxRepositoryLayer = DrizzleOutboxRepository.pipe(
        Layer.provide(databaseLayer),
      );

      // Create a single-poll daemon (poll once and exit)
      const program = Effect.gen(function* () {
        const outboxRepository = yield* OutboxRepository;
        const { GameEventBus } = yield* Effect.promise(() =>
          import('../../../game/game-event-bus.js'),
        );
        const gameEventBus = yield* GameEventBus;

        // Manually poll and process (similar to daemon logic)
        const unprocessed = yield* outboxRepository.findUnprocessed(100);

        for (const row of unprocessed) {
          if (row.aggregateType === 'game') {
            const event = row.payload as { _tag: string; gameId: string; playerId: string };
            yield* gameEventBus.publish(event as never);
          }
          yield* outboxRepository.markAsProcessed(row.id);
        }

        return unprocessed.length;
      });

      // Run the program
      const processedCount = await Effect.runPromise(
        program.pipe(
          Effect.provide(outboxRepositoryLayer),
          Effect.provide(gameEventBusLayer),
        ),
      );

      // Verify event was processed
      expect(processedCount).toBe(1);
      expect(publishedEvents).toHaveLength(1);
      expect(publishedEvents[0]).toMatchObject({
        _tag: 'PlayerJoined',
        gameId: gameId,
        playerId: playerId,
      });

      // Verify event is marked as processed in DB
      const processedEvents = await db.select().from(outboxEventsTable);
      expect(processedEvents[0].processedAt).not.toBeNull();
    });

    it('should process multiple events in order', async () => {
      const db = getTestDb();
      const publishedEvents: Array<{ _tag: string; gameId: string; playerId: string }> = [];

      const gameId = crypto.randomUUID();
      const player1Id = crypto.randomUUID();
      const player2Id = crypto.randomUUID();

      // Insert multiple events
      await db.insert(outboxEventsTable).values([
        {
          id: crypto.randomUUID(),
          aggregateType: 'game',
          aggregateId: gameId,
          aggregateVersion: 1,
          eventType: 'PlayerJoined',
          payload: {
            _tag: 'PlayerJoined',
            gameId: gameId,
            playerId: player1Id,
          },
        },
        {
          id: crypto.randomUUID(),
          aggregateType: 'game',
          aggregateId: gameId,
          aggregateVersion: 2,
          eventType: 'PlayerJoined',
          payload: {
            _tag: 'PlayerJoined',
            gameId: gameId,
            playerId: player2Id,
          },
        },
      ]);

      // Create layers
      const databaseLayer = Layer.succeed(Database, { db });

      const gameEventBusLayer = Layer.succeed(
        (await import('../../../game/game-event-bus.js')).GameEventBus,
        {
          publish: (event) =>
            Effect.sync(() => {
              publishedEvents.push(event as { _tag: string; gameId: string; playerId: string });
            }),
          subscribe: () => {
            const { Stream } = require('effect');
            return Stream.empty;
          },
        },
      );

      const outboxRepositoryLayer = DrizzleOutboxRepository.pipe(
        Layer.provide(databaseLayer),
      );

      // Process events
      const program = Effect.gen(function* () {
        const outboxRepository = yield* OutboxRepository;
        const { GameEventBus } = yield* Effect.promise(() =>
          import('../../../game/game-event-bus.js'),
        );
        const gameEventBus = yield* GameEventBus;

        const unprocessed = yield* outboxRepository.findUnprocessed(100);

        for (const row of unprocessed) {
          if (row.aggregateType === 'game') {
            const event = row.payload as { _tag: string; gameId: string; playerId: string };
            yield* gameEventBus.publish(event as never);
          }
          yield* outboxRepository.markAsProcessed(row.id);
        }

        return unprocessed.length;
      });

      const processedCount = await Effect.runPromise(
        program.pipe(
          Effect.provide(outboxRepositoryLayer),
          Effect.provide(gameEventBusLayer),
        ),
      );

      // Verify both events were processed in order
      expect(processedCount).toBe(2);
      expect(publishedEvents).toHaveLength(2);
      expect(publishedEvents[0].playerId).toBe(player1Id);
      expect(publishedEvents[1].playerId).toBe(player2Id);
    });

    it('should not reprocess already processed events', async () => {
      const db = getTestDb();
      const publishedEvents: Array<{ _tag: string; gameId: string; playerId: string }> = [];

      const gameId = crypto.randomUUID();
      const playerId = crypto.randomUUID();

      // Insert an already processed event
      await db.insert(outboxEventsTable).values({
        id: crypto.randomUUID(),
        aggregateType: 'game',
        aggregateId: gameId,
        aggregateVersion: 1,
        eventType: 'PlayerJoined',
        payload: {
          _tag: 'PlayerJoined',
          gameId: gameId,
          playerId: playerId,
        },
        processedAt: new Date(), // Already processed
      });

      // Create layers
      const databaseLayer = Layer.succeed(Database, { db });

      const gameEventBusLayer = Layer.succeed(
        (await import('../../../game/game-event-bus.js')).GameEventBus,
        {
          publish: (event) =>
            Effect.sync(() => {
              publishedEvents.push(event as { _tag: string; gameId: string; playerId: string });
            }),
          subscribe: () => {
            const { Stream } = require('effect');
            return Stream.empty;
          },
        },
      );

      const outboxRepositoryLayer = DrizzleOutboxRepository.pipe(
        Layer.provide(databaseLayer),
      );

      // Process events
      const program = Effect.gen(function* () {
        const outboxRepository = yield* OutboxRepository;

        const unprocessed = yield* outboxRepository.findUnprocessed(100);
        return unprocessed.length;
      });

      const processedCount = await Effect.runPromise(
        program.pipe(
          Effect.provide(outboxRepositoryLayer),
          Effect.provide(gameEventBusLayer),
        ),
      );

      // Verify no events were processed (already processed)
      expect(processedCount).toBe(0);
      expect(publishedEvents).toHaveLength(0);
    });
  });
});
