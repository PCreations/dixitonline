import { Context, Duration, Effect, Layer, Scope } from 'effect';
import { GameEventBus, type GameEvent } from '../../game/game-event-bus.js';
import type { SelectOutboxEventDto } from '../db/schema.js';
import { OutboxRepository } from './outbox.repository.js';

/**
 * OutboxPollingDaemon provides fallback processing of outbox events.
 *
 * This daemon polls the outbox_events table periodically to catch any events
 * that may have been missed by the Supabase Realtime subscription:
 * - Network disconnections
 * - Realtime service outages
 * - Events inserted before subscription started
 *
 * It provides at-least-once delivery guarantee when combined with the relay.
 */
export class OutboxPollingDaemon extends Context.Tag('OutboxPollingDaemon')<
  OutboxPollingDaemon,
  {
    /**
     * Start the polling daemon.
     * Returns when the daemon is stopped or an error occurs.
     */
    readonly start: () => Effect.Effect<void>;

    /**
     * Stop the polling daemon gracefully.
     */
    readonly stop: () => Effect.Effect<void>;
  }
>() {}

/**
 * Configuration for the polling daemon.
 */
export type OutboxPollingDaemonConfig = {
  /**
   * How often to poll for unprocessed events (in milliseconds).
   * Default: 5000 (5 seconds)
   */
  readonly pollIntervalMs: number;

  /**
   * Maximum number of events to process per poll.
   * Default: 100
   */
  readonly batchSize: number;
};

const defaultConfig: OutboxPollingDaemonConfig = {
  pollIntervalMs: 5000,
  batchSize: 100,
};

/**
 * Live implementation of the polling daemon.
 */
export const makeOutboxPollingDaemonLive = (
  config: Partial<OutboxPollingDaemonConfig> = {},
) =>
  Layer.scoped(
    OutboxPollingDaemon,
    Effect.gen(function* () {
      const outboxRepository = yield* OutboxRepository;
      const gameEventBus = yield* GameEventBus;
      const scope = yield* Scope.Scope;

      const { pollIntervalMs, batchSize } = { ...defaultConfig, ...config };

      let isRunning = false;
      let stopRequested = false;

      const processSingleEvent = (row: SelectOutboxEventDto) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan('context.input', JSON.stringify({
            eventId: row.id,
            eventType: row.eventType,
            aggregateId: row.aggregateId,
            aggregateVersion: row.aggregateVersion,
          }));

          // Only process game events (could support other types later)
          if (row.aggregateType !== 'game') {
            // Mark as processed even if we don't handle it
            yield* outboxRepository.markAsProcessed(row.id);
            yield* Effect.annotateCurrentSpan('context.output', JSON.stringify({
              skipped: true,
              reason: 'unsupported aggregate type',
            }));
            return;
          }

          // The payload is the GameEvent
          const event = row.payload as GameEvent;

          // Publish to local PubSub
          yield* gameEventBus.publish(event);

          // Mark as processed
          yield* outboxRepository.markAsProcessed(row.id);

          yield* Effect.annotateCurrentSpan('context.output', JSON.stringify({
            processed: true,
          }));
        }).pipe(Effect.withSpan('OutboxPollingDaemon.processEvent'));

      const processUnprocessedEvents = Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan('context.input', JSON.stringify({
          batchSize,
        }));

        // Find unprocessed events
        const events = yield* outboxRepository.findUnprocessed(batchSize);

        if (events.length === 0) {
          yield* Effect.annotateCurrentSpan('context.output', JSON.stringify({
            eventsFound: 0,
            eventsProcessed: 0,
          }));
          return;
        }

        // Process each event
        for (const row of events) {
          yield* processSingleEvent(row);
        }

        yield* Effect.annotateCurrentSpan('context.output', JSON.stringify({
          eventsFound: events.length,
          eventsProcessed: events.length,
        }));
      }).pipe(
        Effect.withSpan('OutboxPollingDaemon.pollCycle'),
        Effect.catchAll((error) => {
          // Log error but don't fail the daemon
          console.error('[OutboxPollingDaemon] Error processing events:', error);
          return Effect.void;
        }),
      );

      const pollLoop = Effect.gen(function* () {
        while (!stopRequested) {
          yield* processUnprocessedEvents;
          yield* Effect.sleep(Duration.millis(pollIntervalMs));
        }
      });

      return {
        start: () =>
          Effect.gen(function* () {
            if (isRunning) {
              return; // Already running
            }

            isRunning = true;
            stopRequested = false;

            // Register cleanup on scope finalization
            yield* Scope.addFinalizer(
              scope,
              Effect.sync(() => {
                stopRequested = true;
                isRunning = false;
              }),
            );

            // Run the poll loop
            yield* pollLoop;
          }),

        stop: () =>
          Effect.sync(() => {
            stopRequested = true;
            isRunning = false;
          }),
      };
    }),
  );

/**
 * Default polling daemon with standard configuration.
 */
export const OutboxPollingDaemonLive = makeOutboxPollingDaemonLive();

/**
 * No-op implementation for testing.
 */
export const OutboxPollingDaemonTest = Layer.succeed(OutboxPollingDaemon, {
  start: () => Effect.void,
  stop: () => Effect.void,
});
