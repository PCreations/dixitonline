import { Effect, Stream } from 'effect';
import {
  GameEventBus,
  type GameEvent,
  InMemoryGameEventBus,
} from '../game/game-event-bus.js';
import { matchGameEvent } from '../game/game-events.js';
import { AnalyticsProvider } from './analytics-provider.js';
import { NoopAnalyticsProvider } from './infra/noop-analytics-provider.js';

/**
 * Consumer that listens to GameEventBus and tracks events to analytics.
 * Transforms domain events into analytics events with appropriate naming.
 *
 * This runs as a background fiber and processes events as they arrive.
 * Errors are caught and logged but never propagate to prevent analytics
 * from affecting game functionality.
 */
export class AnalyticsConsumer extends Effect.Service<AnalyticsConsumer>()(
  'AnalyticsConsumer',
  {
    effect: Effect.gen(function* () {
      const eventBus = yield* GameEventBus;
      const analytics = yield* AnalyticsProvider;

      const trackEvent = (event: GameEvent): Effect.Effect<void> =>
        matchGameEvent(event, {
          GameStarted: ({ gameId }) =>
            analytics.track({
              name: 'game_started',
              params: { game_id: gameId },
            }),

          ClueSubmitted: ({ gameId, wasAutoPlayed }) =>
            analytics.track({
              name: 'clue_submitted',
              params: {
                game_id: gameId,
                was_auto_played: wasAutoPlayed,
              },
            }),

          CardSelected: ({ gameId, playerId, wasAutoPlayed }) =>
            analytics.track({
              name: 'card_selected',
              params: {
                game_id: gameId,
                player_id: playerId,
                was_auto_played: wasAutoPlayed,
              },
            }),

          VoteSubmitted: ({ gameId, playerId, wasAutoPlayed }) =>
            analytics.track({
              name: 'vote_cast',
              params: {
                game_id: gameId,
                player_id: playerId,
                was_auto_played: wasAutoPlayed,
              },
            }),

          TurnScored: ({ gameId }) =>
            analytics.track({
              name: 'turn_scored',
              params: { game_id: gameId },
            }),

          GameEnded: ({ gameId }) =>
            analytics.track({
              name: 'game_completed',
              params: { game_id: gameId },
            }),

          // Events not tracked in analytics
          PlayerJoined: () => Effect.void,
          PlayerLeft: () => Effect.void,
        }).pipe(
          Effect.catchAll((error) => {
            console.error('[AnalyticsConsumer] Error tracking event:', error);
            return Effect.void;
          }),
        );

      return {
        /**
         * Start consuming events from the GameEventBus.
         * Returns immediately after forking the consumer fiber.
         * The fiber runs indefinitely until the process exits.
         */
        start: () =>
          Effect.gen(function* () {
            const stream = eventBus.subscribeAll();

            yield* Stream.runForEach(stream, trackEvent).pipe(
              Effect.catchAll((error) => {
                console.error('[AnalyticsConsumer] Stream error:', error);
                return Effect.void;
              }),
              Effect.fork,
            );

            console.log('[AnalyticsConsumer] Started');
          }).pipe(Effect.withSpan('AnalyticsConsumer.start')),
      };
    }),
    dependencies: [InMemoryGameEventBus, NoopAnalyticsProvider],
  },
) {}

/**
 * Live layer with actual analytics tracking.
 * Use this in production with FirebaseAnalyticsProvider.
 */
export const AnalyticsConsumerLive = AnalyticsConsumer.Default;

/**
 * Test layer that discards all analytics events.
 * Uses NoopAnalyticsProvider so tracking calls do nothing.
 */
export const AnalyticsConsumerTest = AnalyticsConsumer.Default;
