import type { RealtimeChannel, RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { Context, Effect, Layer, Runtime, Scope } from 'effect';
import { GameEventBus, type GameEvent } from '../../game/game-event-bus.js';
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
 * Note: Supabase returns snake_case columns.
 */
type OutboxEventRow = {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  aggregate_version: number;
  event_type: string;
  payload: GameEvent;
  created_at: string;
  processed_at: string | null;
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

      // Only relay game events (could support other aggregate types later)
      if (row.aggregate_type !== 'game') {
        return;
      }

      // The payload is already the GameEvent object
      const event = row.payload as GameEvent;

      // Publish to local PubSub and mark as processed
      const program = Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan('context.input', JSON.stringify({
          eventId: row.id,
          eventType: row.event_type,
          aggregateId: row.aggregate_id,
          aggregateVersion: row.aggregate_version,
        }));

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
          if (channel) {
            return; // Already started
          }

          channel = yield* supabaseClient.subscribeToInserts<OutboxEventRow>(
            'outbox_events',
            handleOutboxInsert,
          );

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
        }),

      stop: () =>
        Effect.gen(function* () {
          if (channel) {
            yield* supabaseClient.unsubscribe(channel);
            channel = null;
          }
        }),
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
