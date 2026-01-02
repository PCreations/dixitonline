---
name: domain-events
description: Domain events using Data.TaggedEnum from Effect. Events are produced by aggregates (DDD), typed precisely in signatures. Use pattern matching ($match) for handling. Triggers on "event", "domain event", "TaggedEnum", "aggregate event".
---

# Domain Events Pattern

## Core Principles

1. **Events are produced by aggregates**, not use cases
2. **Events describe what happened** (past tense), not what to do
3. **Exact event types in signatures** - methods declare precisely which events they emit
4. **Pattern matching** for exhaustive event handling

## Event Definition

Define events in a dedicated file using `Data.TaggedEnum`:

```typescript
// src/game/game-events.ts
import { Data } from "effect";
import type { GameId } from "./game.entity.js";
import type { PlayerId } from "./player.entity.js";

export type GameEvent = Data.TaggedEnum<{
  PlayerJoined: { readonly gameId: GameId; readonly playerId: PlayerId };
  PlayerLeft: { readonly gameId: GameId; readonly playerId: PlayerId };
  GameStarted: { readonly gameId: GameId };
  ClueSubmitted: { readonly gameId: GameId };
  CardSelected: { readonly gameId: GameId; readonly playerId: PlayerId };
  VoteSubmitted: { readonly gameId: GameId; readonly playerId: PlayerId };
  TurnScored: { readonly gameId: GameId };
  GameEnded: { readonly gameId: GameId };
}>;

// Extract constructors and pattern matching function
const {
  $match: matchGameEvent,
  PlayerJoined,
  PlayerLeft,
  GameStarted,
  ClueSubmitted,
  CardSelected,
  VoteSubmitted,
  TurnScored,
  GameEnded,
} = Data.taggedEnum<GameEvent>();

// Export constructors and matcher
export {
  CardSelected,
  ClueSubmitted,
  GameEnded,
  GameStarted,
  matchGameEvent,
  PlayerJoined,
  PlayerLeft,
  TurnScored,
  VoteSubmitted,
};

// Extract specific event types for function signatures
export type PlayerJoinedEvent = Extract<GameEvent, { readonly _tag: "PlayerJoined" }>;
export type PlayerLeftEvent = Extract<GameEvent, { readonly _tag: "PlayerLeft" }>;
export type GameStartedEvent = Extract<GameEvent, { readonly _tag: "GameStarted" }>;
export type ClueSubmittedEvent = Extract<GameEvent, { readonly _tag: "ClueSubmitted" }>;
export type CardSelectedEvent = Extract<GameEvent, { readonly _tag: "CardSelected" }>;
export type VoteSubmittedEvent = Extract<GameEvent, { readonly _tag: "VoteSubmitted" }>;
export type TurnScoredEvent = Extract<GameEvent, { readonly _tag: "TurnScored" }>;
export type GameEndedEvent = Extract<GameEvent, { readonly _tag: "GameEnded" }>;
```

## EntityWithEvents Type

Aggregate mutations return both the updated entity AND the events produced:

```typescript
// src/game/game.entity.ts
export type EntityWithEvents<
  TEntity,
  TEvent extends GameEvent = GameEvent,
> = {
  readonly entity: TEntity;
  readonly events: ReadonlyArray<TEvent>;
};
```

## Aggregate Method Signatures

**CRITICAL**: Methods MUST specify the exact event type(s) they produce.

### Single Event Type

```typescript
addPlayer(playerId: PlayerId): Effect.Effect<
  EntityWithEvents<NotStartedGameEntity, PlayerJoinedEvent>,  // Exact type!
  Error
> {
  return Effect.gen(this, function* () {
    // validation...
    const entity = new NotStartedGameEntity({
      ...this.props,
      players: [...this.props.players, playerId],
      version: this.props.version + 1,
    });

    return {
      entity,
      events: [PlayerJoined({ gameId: this.props.id, playerId })],
    };
  });
}
```

### Multiple Possible Events (Union Type)

When a method can produce different events based on conditions:

```typescript
notifyReadyForNextTurn(opts: {
  playerId: PlayerId;
}): Effect.Effect<
  EntityWithEvents<GameEntity, TurnScoredEvent | GameEndedEvent>,  // Union!
  Error
> {
  // ...
  if (this.shouldGameEnd()) {
    return Effect.succeed({
      entity: new EndedGameEntity({ /* ... */ }),
      events: [GameEnded({ gameId: this.props.id })],
    });
  }

  return Effect.succeed({
    entity: StartedGameEntity.create({ /* ... */ }),
    events: [TurnScored({ gameId: this.props.id })],
  });
}
```

## Pattern Matching for Event Handling

Use `matchGameEvent` (the `$match` function) for exhaustive handling:

```typescript
import { matchGameEvent } from "./game-events.js";

// In SSE handler
yield* matchGameEvent(event, {
  GameStarted: () =>
    Effect.sync(() => {
      reply.raw.write(`event: GameStarted\ndata: redirect\n\n`);
    }),
  PlayerJoined: () => sendLobbyUpdate("PlayerJoined"),
  PlayerLeft: () => sendLobbyUpdate("PlayerLeft"),
  ClueSubmitted: () => Effect.void,
  CardSelected: () => Effect.void,
  VoteSubmitted: () => Effect.void,
  TurnScored: () => Effect.void,
  GameEnded: () => Effect.void,
});
```

## Use Case Integration

Use cases delegate to aggregates and collect events:

```typescript
export class JoinGameUseCase extends Effect.Service<JoinGameUseCase>()(
  "game/JoinGameUseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;

      return {
        joinGame: (props: JoinGameCommand) => {
          const joinGameLogic = Effect.gen(function* () {
            const game = yield* gameRepository.findNotStartedGameById(props.gameId);

            const gameEntity = yield* Option.match(game, {
              onNone: () => Effect.fail(new Error("Game not found")),
              onSome: Effect.succeed,
            });

            // Aggregate produces both entity AND events
            const { entity: updatedGame, events } = yield* gameEntity.addPlayer(
              PlayerId(props.playerId),
            );

            // Save with events (outbox pattern)
            yield* gameRepository.saveWithEvents(updatedGame, events);
          });

          return withOptimisticRetry(joinGameLogic);
        },
      };
    }),
  },
) {}
```

## Anti-patterns

### BAD: Generic GameEvent in signature

```typescript
// BAD - too generic, doesn't document what events are produced
addPlayer(playerId: PlayerId): Effect.Effect<EntityWithEvents<NotStartedGameEntity>, Error>
```

### GOOD: Exact event type

```typescript
// GOOD - signature documents exactly what event is produced
addPlayer(playerId: PlayerId): Effect.Effect<
  EntityWithEvents<NotStartedGameEntity, PlayerJoinedEvent>,
  Error
>
```

### BAD: Creating events in use case

```typescript
// BAD - events should be produced by aggregate
yield* gameRepository.save(updatedGame);
yield* gameEventBus.publish(PlayerJoined({ gameId, playerId }));
```

### GOOD: Events from aggregate

```typescript
// GOOD - aggregate produces events
const { entity, events } = yield* gameEntity.addPlayer(playerId);
yield* gameRepository.saveWithEvents(entity, events);
```

### BAD: if/else on _tag

```typescript
// BAD - not exhaustive, easy to miss cases
if (event._tag === "PlayerJoined") {
  // handle
} else if (event._tag === "PlayerLeft") {
  // handle
}
```

### GOOD: Pattern matching

```typescript
// GOOD - exhaustive, compiler enforces all cases
yield* matchGameEvent(event, {
  PlayerJoined: () => /* ... */,
  PlayerLeft: () => /* ... */,
  // ... all cases required
});
```

## Examples

- [game-events.ts](src/game/game-events.ts) - Event definitions
- [game.entity.ts](src/game/game.entity.ts) - Aggregate producing events
- [join-game.usecase.ts](src/game/join-game.usecase.ts) - Use case collecting events
- [server.ts](src/server.ts) - SSE handler with pattern matching
