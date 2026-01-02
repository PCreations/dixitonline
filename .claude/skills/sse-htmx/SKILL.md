# Skill: SSE-HTMX Real-time Updates

## Overview

This skill documents the pattern for implementing real-time UI updates using Server-Sent Events (SSE) with HTMX in the Tixid Online application.

## When to Use

Use this pattern when you need to:
- Update the UI in real-time when backend state changes
- Notify multiple clients simultaneously about events
- Keep UI synchronized across browser tabs/users

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SSE Flow                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. GameEventBus (Effect Service - in-memory pub/sub)       │
│     - subscribe(gameId) → Stream<GameEvent>                 │
│     - publish(event)                                        │
│                        ↓                                     │
│  2. Use Cases publish after mutation                        │
│     JoinGameUseCase.execute() → publish("playerJoined")     │
│     LeaveGameUseCase.execute() → publish("playerLeft")      │
│     StartGameUseCase.execute() → publish("gameStarted")     │
│                        ↓                                     │
│  3. SSE Endpoint: GET /game/:gameId/events                  │
│     - Keeps HTTP connection open                            │
│     - Subscribes to GameEventBus                            │
│     - Streams HTML fragments                                │
│                        ↓                                     │
│  4. HTMX Client                                              │
│     <div hx-ext="sse" sse-connect="/game/:id/events">       │
│       <div sse-swap="playerJoined, playerLeft">...</div>    │
│     </div>                                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Define Business Events

Events should describe what happened from a business perspective, not technical actions:

```typescript
// src/game/game-event-bus.ts
export type GameEvent =
  | { readonly type: "playerJoined"; readonly gameId: string; readonly playerId: string }
  | { readonly type: "playerLeft"; readonly gameId: string; readonly playerId: string }
  | { readonly type: "gameStarted"; readonly gameId: string }
  | { readonly type: "clueSubmitted"; readonly gameId: string }
  | { readonly type: "cardSelected"; readonly gameId: string; readonly playerId: string }
  | { readonly type: "voteSubmitted"; readonly gameId: string; readonly playerId: string }
  | { readonly type: "turnScored"; readonly gameId: string }
  | { readonly type: "gameEnded"; readonly gameId: string };
```

### 2. Create the Event Bus Service

```typescript
import { Context, Effect, Layer, PubSub, Stream } from "effect";

export class GameEventBus extends Context.Tag("game/GameEventBus")<
  GameEventBus,
  {
    readonly publish: (event: GameEvent) => Effect.Effect<void>;
    readonly subscribe: (gameId: string) => Stream.Stream<GameEvent>;
  }
>() {}

export const InMemoryGameEventBus = Layer.effect(
  GameEventBus,
  Effect.gen(function* () {
    const pubsub = yield* PubSub.unbounded<GameEvent>();

    return {
      publish: (event) => PubSub.publish(pubsub, event),
      subscribe: (gameId) =>
        Stream.fromPubSub(pubsub).pipe(
          Stream.filter((e) => e.gameId === gameId),
        ),
    };
  }),
);

// For tests - a no-op implementation
export const NoopGameEventBus = Layer.succeed(GameEventBus, {
  publish: () => Effect.void,
  subscribe: () => Stream.empty,
});
```

### 3. Publish Events from Use Cases

After saving the entity, publish the event:

```typescript
// In use case
const gameEventBus = yield* GameEventBus;

// After save
yield* gameEventBus.publish({
  type: "playerJoined",
  gameId: props.gameId,
  playerId: props.playerId,
});
```

### 4. Create SSE Endpoint

```typescript
// GET /game/:gameId/events
server.get(
  "/game/:gameId/events",
  async (request, reply) => {
    const { gameId } = request.params as { gameId: string };

    // Set SSE headers
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    });

    // Subscribe to events
    const program = Effect.gen(function* () {
      const gameEventBus = yield* GameEventBus;
      const stream = gameEventBus.subscribe(gameId);

      yield* Stream.runForEach(stream, (event) =>
        Effect.gen(function* () {
          const html = yield* Effect.promise(() => renderFragment(event, gameId));
          reply.raw.write(`event: ${event.type}\ndata: ${html}\n\n`);
        }),
      );
    });

    await Effect.runPromise(program.pipe(Effect.provide(GameLayerLive)));
  },
);
```

### 5. Create Fragment Route

```typescript
// GET /game/:gameId/lobby/content
server.get(
  "/game/:gameId/lobby/content",
  async (request, reply) => {
    const { gameId } = request.params as { gameId: string };

    // Render just the fragment HTML
    const html = await renderLobbyContent(gameId);

    reply.type("text/html");
    return html;
  },
);
```

### 6. Extract Component for Fragment Rendering

Create a separate component that can be rendered independently:

```tsx
// src/view/components/LobbyContent.tsx
export const LobbyContent = (vm: LobbyViewModel) => (
  <div id="lobby-content" class="lobby-content">
    {/* Dynamic content that changes */}
    <PlayersList players={vm.players} />
    <GameActions {...vm} />
  </div>
);
```

### 7. Use SSE in HTMX Template

```tsx
// src/view/components/Lobby.tsx
export const Lobby = (vm: LobbyViewModel) => (
  <div class="lobby-container">
    {/* Static content */}
    <h1>Game Lobby</h1>

    {/* SSE-enabled dynamic content */}
    <div hx-ext="sse" sse-connect={`/game/${vm.gameId}/events`}>
      {/* Swapped on playerJoined or playerLeft events */}
      <div
        sse-swap="playerJoined, playerLeft"
        hx-swap="outerHTML"
      >
        <LobbyContent {...vm} />
      </div>

      {/* Redirect on gameStarted */}
      <div sse-swap="gameStarted" hx-swap="innerHTML" />
    </div>
  </div>
);
```

## SSE Event Format

Events follow SSE specification:

```
event: playerJoined
data: <div id="lobby-content">...HTML fragment...</div>

event: gameStarted
data: <script>window.location.href = '/game/xxx/play'</script>
```

## Testing

Add `NoopGameEventBus` to test layers:

```typescript
// In test driver
const testLayer = Layer.mergeAll(
  // ... other layers
  NoopGameEventBus,
);
```

## Key HTMX Attributes

| Attribute | Description |
|-----------|-------------|
| `hx-ext="sse"` | Enable SSE extension |
| `sse-connect="/url"` | SSE endpoint URL |
| `sse-swap="event1, event2"` | Events that trigger swap |
| `hx-swap="outerHTML"` | How to swap (outerHTML, innerHTML) |

## Error Handling

- Browser automatically reconnects on SSE disconnect (exponential backoff)
- Server should handle `request.raw.on('close', ...)` for cleanup
- Consider adding heartbeat events for connection health

## Scalability Notes

- Current implementation uses in-memory PubSub (single instance)
- For multi-instance: consider Redis PubSub or similar
- Effect Stream handles cleanup automatically when client disconnects

## Files Reference

- Event Bus: [src/game/game-event-bus.ts](src/game/game-event-bus.ts)
- SSE Route: [src/server.ts](src/server.ts) - `/game/:gameId/events`
- Fragment Route: [src/server.ts](src/server.ts) - `/game/:gameId/lobby/content`
- Lobby Component: [src/view/components/Lobby.tsx](src/view/components/Lobby.tsx)
- Lobby Content: [src/view/components/LobbyContent.tsx](src/view/components/LobbyContent.tsx)
