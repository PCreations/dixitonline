import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
} from '@supabase/supabase-js';
import { Context, Effect, Layer, Runtime, Scope } from 'effect';
import { type GameEvent, GameEventBus } from '../../game/game-event-bus.js';
import { SupabaseClient } from '../supabase/supabase-client.service.js';
import { OutboxRepository } from './outbox.repository.js';

/**
 * OutboxEventRelay listens to INSERT events on the outbox_events table
 * via Supabase Realtime and publishes them to the local GameEventBus.
 *
 * This enables cross-instance event delivery:
 * - Instance A saves game + outbox event in transaction
 * - Supabase Realtime broadcasts the INSERT
 * - All instances (including A) receive and publish to their local PubSub
 * - SSE handlers on each instance push updates to connected clients
 */
export class OutboxEventRelay extends Context.Tag('OutboxEventRelay')<
  OutboxEventRelay,
  {
    /**
     * Start listening for outbox events.
     * Returns a cleanup effect to stop listening.
     */
    readonly start: () => Effect.Effect<void>;

    /**
     * Stop listening for outbox events.
     */
    readonly stop: () => Effect.Effect<void>;
  }
>() {}

/**
 * Type for the outbox_events row as received from Supabase Realtime.
 * Supabase returns columns exactly as defined in the database (camelCase).
 */
type OutboxEventRow = {
  id: string;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number;
  eventType: string;
  payload: GameEvent;
  createdAt: string;
  processedAt: string | null;
};

/**
 * Live implementation using Supabase Realtime.
 */
export const OutboxEventRelayLive = Layer.scoped(
  OutboxEventRelay,
  Effect.gen(function* () {
    const supabaseClient = yield* SupabaseClient;
    const gameEventBus = yield* GameEventBus;
    const outboxRepository = yield* OutboxRepository;
    const scope = yield* Scope.Scope;
    const runtime = yield* Effect.runtime<never>();

    let channel: RealtimeChannel | null = null;

    const handleOutboxInsert = (
      payload: RealtimePostgresInsertPayload<OutboxEventRow>,
    ) => {
      const row = payload.new;
      console.log('[OutboxEventRelay] Received INSERT event:', {
        id: row.id,
        eventType: row.eventType,
        aggregateId: row.aggregateId,
      });

      // Only relay game events (could support other aggregate types later)
      if (row.aggregateType !== 'game') {
        console.log('[OutboxEventRelay] Skipping non-game event');
        return;
      }

      // The payload is already the GameEvent object
      const event = row.payload as GameEvent;

      // Publish to local PubSub and mark as processed
      const program = Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan(
          'context.input',
          JSON.stringify({
            eventId: row.id,
            eventType: row.eventType,
            aggregateId: row.aggregateId,
            aggregateVersion: row.aggregateVersion,
          }),
        );

        yield* gameEventBus.publish(event);
        yield* outboxRepository.markAsProcessed(row.id);

        yield* Effect.annotateCurrentSpan('context.output', 'no data');
      }).pipe(
        Effect.withSpan('OutboxEventRelay.handleEvent'),
        Effect.catchAll(() => Effect.void), // Don't fail on relay errors
      );

      // Run the effect using the runtime
      Runtime.runPromise(runtime)(program);
    };

    return {
      start: () =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan(
            'context.input',
            JSON.stringify({
              table: 'outbox_events',
            }),
          );

          if (channel) {
            console.log('[OutboxEventRelay] Already started, skipping');
            yield* Effect.annotateCurrentSpan(
              'context.output',
              JSON.stringify({
                skipped: true,
                reason: 'already started',
              }),
            );
            return; // Already started
          }

          console.log(
            '[OutboxEventRelay] Subscribing to outbox_events table...',
          );
          channel = yield* supabaseClient.subscribeToInserts<OutboxEventRow>(
            'outbox_events',
            handleOutboxInsert,
          );
          console.log('[OutboxEventRelay] Subscription established');

          // Register cleanup on scope finalization
          yield* Scope.addFinalizer(
            scope,
            Effect.gen(function* () {
              if (channel) {
                yield* supabaseClient.unsubscribe(channel);
                channel = null;
              }
            }),
          );

          yield* Effect.annotateCurrentSpan(
            'context.output',
            JSON.stringify({
              subscribed: true,
            }),
          );
        }).pipe(Effect.withSpan('OutboxEventRelay.start')),

      stop: () =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan('context.input', 'no data');

          if (channel) {
            yield* supabaseClient.unsubscribe(channel);
            channel = null;
            yield* Effect.annotateCurrentSpan(
              'context.output',
              JSON.stringify({
                unsubscribed: true,
              }),
            );
          } else {
            yield* Effect.annotateCurrentSpan(
              'context.output',
              JSON.stringify({
                skipped: true,
                reason: 'not started',
              }),
            );
          }
        }).pipe(Effect.withSpan('OutboxEventRelay.stop')),
    };
  }),
);

/**
 * No-op implementation for testing.
 * In tests, events are published directly to the in-memory PubSub.
 */
export const OutboxEventRelayTest = Layer.succeed(OutboxEventRelay, {
  start: () => Effect.void,
  stop: () => Effect.void,
});
