import { Context, Effect, Layer, PubSub, Stream } from "effect";
import { type GameEvent } from "./game-events.js";

export { type GameEvent } from "./game-events.js";

/**
 * Event bus for publishing and subscribing to game events.
 * Used to notify clients of game state changes via SSE.
 */
export class GameEventBus extends Context.Tag("game/GameEventBus")<
  GameEventBus,
  {
    /**
     * Publish an event to all subscribers of the game.
     */
    readonly publish: (event: GameEvent) => Effect.Effect<void>;

    /**
     * Subscribe to events for a specific game.
     * Returns a stream that emits events for the given gameId.
     */
    readonly subscribe: (gameId: string) => Stream.Stream<GameEvent>;
  }
>() {}

/**
 * In-memory implementation using Effect PubSub.
 * Suitable for single-instance deployments.
 * For multi-instance, could be replaced with Redis PubSub.
 */
export const InMemoryGameEventBus = Layer.effect(
  GameEventBus,
  Effect.gen(function* () {
    const pubsub = yield* PubSub.unbounded<GameEvent>();

    return {
      publish: (event) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan('context.input', JSON.stringify(event));
          yield* PubSub.publish(pubsub, event);
          yield* Effect.annotateCurrentSpan('context.output', 'no data');
        }).pipe(Effect.withSpan('GameEventBus.publish')),

      subscribe: (gameId) =>
        Stream.fromPubSub(pubsub).pipe(
          Stream.filter((event) => event.gameId === gameId),
        ),
    };
  }),
);

/**
 * No-op implementation for testing use cases in isolation.
 * Events are discarded and subscriptions return empty streams.
 */
export const NoopGameEventBus = Layer.succeed(GameEventBus, {
  publish: () => Effect.void,
  subscribe: () => Stream.empty,
});
