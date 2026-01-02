---
name: adding-htmx-route
description: Adds Fastify routes with thin controllers and pure view models for HATEOAS-driven UI. Use when creating pages, forms, or components. Triggers on "route", "page", "composant", "HTMX", "view model", "query service".
---

# Adding HTMX Routes (HATEOAS + CQRS)

## Philosophy

**HATEOAS**: Server controls ALL UI logic. Client only renders.

**Thin Controllers**: Routes ONLY orchestrate - no side effects, no business logic, no presentation logic.

**Pure View Models**: `viewModel = f(state, props)` - no side effects, like React.

**CQRS**: Queries via Query Services, Commands via Use Cases.

## Architecture

```
Read (GET):
  Route → Query Service → State → Pure View Model → Component → HTML

Write (POST):
  Route → Use Case → Redirect
```

## Query Service Pattern

Query services encapsulate data loading. Controllers never access repositories directly.

```typescript
// src/game/lobby.query-service.ts
export class LobbyQueryService extends Effect.Service<LobbyQueryService>()(
  "game/LobbyQueryService",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;

      return {
        getLobbyState: (gameId: string) =>
          Effect.gen(function* () {
            const maybeGame = yield* gameRepository.findById(gameId);
            return Option.map(maybeGame, (game) => game.toSnapshot());
          }),
      };
    }),
    dependencies: [InMemoryGameRepository],
  },
) {}
```

## Pure View Model Pattern

View models are **pure functions**: `output = f(state, props)`

- **state**: Data from query service
- **props**: Route parameters, query params, current user context

```typescript
// src/view/view-models/lobby.view-model.ts

export interface LobbyViewModel {
  readonly gameId: string;
  readonly players: ReadonlyArray<{ name: string; isHost: boolean }>;
  readonly statusMessage: string;
  readonly actions: ReadonlyArray<LobbyAction>;
}

// Pure function: output = f(state, props)
export function createLobbyViewModel(
  state: { game: NotStartedGameSnapshot },
  props: { currentPlayerId: string },
): LobbyViewModel {
  const { game } = state;
  const { currentPlayerId } = props;

  const isHost = game.createdBy === currentPlayerId;
  const canStart = isHost && game.players.length >= 3;

  return {
    gameId: game.id,
    players: game.players.map((id) => ({
      name: id,
      isHost: id === game.createdBy,
    })),
    statusMessage: deriveStatusMessage(game.players.length, canStart),
    actions: buildActions(game.id, { isHost, canStart }),
  };
}
```

**Existing example**: See [LobbyViewProjectorImpl](src/game/game-view-projector.ts#L27-L47)

## Thin Controller (GET)

No side effects in controller. Delegate to query service.

```typescript
// src/server.ts
fastify.route({
  method: "GET",
  url: "/game/:gameId/lobby",
  handler: async (request, reply) => {
    const { gameId } = request.params as { gameId: string };

    const program = Effect.gen(function* () {
      const { playerId } = yield* CurrentUser;
      const queryService = yield* LobbyQueryService;

      // 1. Query service loads state
      const maybeGame = yield* queryService.getLobbyState(gameId);

      return Option.match(maybeGame, {
        onNone: () => reply.status(404).send({ error: "Game not found" }),
        onSome: (gameSnapshot) => {
          // 2. Pure view model: f(state, props)
          const viewModel = createLobbyViewModel(
            { game: gameSnapshot },
            { currentPlayerId: playerId },
          );

          // 3. Render
          const html = renderHtmlPage("Lobby", renderToString(h(Lobby, viewModel)));
          return reply.type("text/html").send(html);
        },
      });
    });

    return appRuntime
      .runPromise(program.pipe(Effect.provide(request.authLayer)))
      .catch(handleError(request, reply));
  },
});
```

## Thin Controller (POST)

Delegate to use case.

```typescript
fastify.route({
  method: "POST",
  url: "/game/:gameId/start",
  handler: async (request, reply) => {
    const { gameId } = request.params as { gameId: string };

    const program = Effect.gen(function* () {
      const { playerId } = yield* CurrentUser;
      const useCase = yield* StartGameUseCase;

      yield* useCase.startGame({ gameId, playerId });

      if (request.headers["hx-request"]) {
        reply.header("HX-Redirect", `/game/${gameId}`);
        return reply.status(200).send();
      }
      return reply.redirect(`/game/${gameId}`);
    });

    return appRuntime
      .runPromise(program.pipe(Effect.provide(request.authLayer)))
      .catch(handleError(request, reply));
  },
});
```

## Pure JSX Component

Components receive view model, render it. **NO LOGIC**.

```typescript
// src/view/components/Lobby.tsx
export function Lobby(vm: LobbyViewModel) {
  return (
    <div class="lobby-container">
      <p>{vm.statusMessage}</p>
      <ul>
        {vm.players.map((p) => (
          <li key={p.name}>{p.name} {p.isHost && "(Hôte)"}</li>
        ))}
      </ul>
      <div class="actions">
        {vm.actions.map((action) => <ActionButton key={action.type} action={action} />)}
      </div>
    </div>
  );
}
```

## Rules

| Layer | Responsibility | Side Effects |
|-------|---------------|--------------|
| **Route** | Orchestrate (no logic) | Minimal (reply) |
| **Query Service** | Load state | Yes (I/O) |
| **Use Case** | Execute commands | Yes (I/O) |
| **View Model** | `f(state, props) → ViewModel` | **NO** |
| **Component** | Render view model to JSX | **NO** |

## Checklist

1. Create query service: `src/game/{name}.query-service.ts`
2. Create pure view model: `src/view/view-models/{name}.view-model.ts`
3. Add thin route in [server.ts](src/server.ts) - no direct I/O
4. Create pure component: `src/view/components/{Name}.tsx`

## Anti-patterns

```typescript
// BAD: Controller accesses repository directly
const game = yield* gameRepository.findById(gameId); // Use query service!

// BAD: Side effect in view model
function createViewModel(state, props) {
  console.log("Creating"); // NO!
  await fetch(...);        // NO!
}

// BAD: Logic in component
function Lobby({ game, playerId }) {
  const canStart = game.players.length >= 3; // Move to view model!
}
```
