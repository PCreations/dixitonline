import { Context, Effect, Layer, PubSub, Stream } from "effect";

/**
 * Domain events for game state changes.
 * Events describe what happened (past tense), not what to do.
 */
export type GameEvent =
  | { readonly type: "playerJoined"; readonly gameId: string; readonly playerId: string }
  | { readonly type: "playerLeft"; readonly gameId: string; readonly playerId: string }
  | { readonly type: "gameStarted"; readonly gameId: string }
  | { readonly type: "clueSubmitted"; readonly gameId: string }
  | { readonly type: "cardSelected"; readonly gameId: string; readonly playerId: string }
  | { readonly type: "voteSubmitted"; readonly gameId: string; readonly playerId: string }
  | { readonly type: "turnScored"; readonly gameId: string }
  | { readonly type: "gameEnded"; readonly gameId: string };

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
        PubSub.publish(pubsub, event).pipe(Effect.asVoid),

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
