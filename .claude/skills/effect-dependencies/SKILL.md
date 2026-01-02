---
name: effect-dependencies
description: Effect dependency injection rules. ALWAYS depend on abstractions (Context.Tag), NEVER on concretions. Services never bake-in implementation dependencies. Triggers on "dependency", "injection", "layer", "service", "abstraction".
---

# Effect Dependencies - Depend on Abstractions

## Core Principle

**Dependency Inversion Principle (DIP)**

```
ALWAYS depend on abstractions (Context.Tag) → NEVER on concretions (Layer implementations)
```

Services should depend on INTERFACES (Context.Tag), not on specific implementations.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Application Layer (server.ts)                      │
│  - Composes layers                                  │
│  - Provides concrete implementations                │
├─────────────────────────────────────────────────────┤
│  Use Cases / Query Services                         │
│  - Depend on abstract interfaces (Tags)             │
│  - NO baked-in dependencies                         │
├─────────────────────────────────────────────────────┤
│  Ports (abstract interfaces)                        │
│  - Context.Tag definitions                          │
│  - GameRepository, DeckRepository, etc.             │
├─────────────────────────────────────────────────────┤
│  Infrastructure (implementations)                   │
│  - DrizzleGameRepository                            │
│  - InMemoryGameRepository (for tests)               │
└─────────────────────────────────────────────────────┘
```

## Defining Abstract Interfaces (Ports)

```typescript
// src/game/game.repository.ts

// 1. Define the INTERFACE (abstraction)
export class GameRepository extends Context.Tag("GameRepository")<
  GameRepository,
  {
    readonly findById: (id: string) => Effect.Effect<Option<GameEntity>>;
    readonly save: (game: GameEntity) => Effect.Effect<void, SaveError>;
  }
>() {}
```

## Services WITHOUT Dependencies

Services must NOT bake-in implementation dependencies.

```typescript
// BAD: Baked-in dependency on InMemoryGameRepository
export class LobbyQueryService extends Effect.Service<LobbyQueryService>()(
  "game/LobbyQueryService",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      return { /* ... */ };
    }),
    dependencies: [InMemoryGameRepository], // BAD!
  },
) {}

// GOOD: No baked-in dependencies, depends only on abstraction
export class LobbyQueryService extends Effect.Service<LobbyQueryService>()(
  "game/LobbyQueryService",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository; // Depends on TAG
      return { /* ... */ };
    }),
    // No dependencies - implementation provided by layer composition
  },
) {}
```

## Layer Composition

The APPLICATION layer is responsible for providing concrete implementations.

```typescript
// src/game/index.ts

// Services without dependencies (depend on abstractions)
const ServicesWithoutDependencies = Layer.mergeAll(
  CreateGameUseCase.Default,
  JoinGameUseCase.Default,
  LobbyQueryService.Default,
);

// Complete layer: provide implementations AFTER services
export const GameLayerLiveWithDependencies = ServicesWithoutDependencies.pipe(
  // Provide concrete implementations
  Layer.provideMerge(DrizzleGameRepository), // Provides GameRepository
  Layer.provideMerge(JsonDeckRepository),    // Provides DeckRepository
);
```

## Testing with Different Implementations

Because services depend on abstractions, you can easily swap implementations for testing:

```typescript
// Production: Drizzle (PostgreSQL)
const ProductionLayer = ServicesWithoutDependencies.pipe(
  Layer.provideMerge(DrizzleGameRepository),
);

// Tests: In-Memory
const TestLayer = ServicesWithoutDependencies.pipe(
  Layer.provideMerge(InMemoryGameRepository),
);
```

## Use Case Pattern

Use cases expose TWO layers:

```typescript
export class MyUseCase extends Effect.Service<MyUseCase>()(
  "game/MyUseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository; // Abstract!
      const deckRepository = yield* DeckRepository; // Abstract!

      return {
        execute: (command) => Effect.gen(function* () {
          // ...
        }),
      };
    }),
    // Optional: for convenience when using standalone
    dependencies: [InMemoryGameRepository, InMemoryDeckRepository],
  },
) {
  // Expose version without baked-in dependencies
  static readonly DefaultWithoutDependencies = Layer.effect(
    MyUseCase,
    Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const deckRepository = yield* DeckRepository;
      return { /* same implementation */ };
    }),
  );
}
```

## Query Service Pattern

Query services follow the same principle:

```typescript
export class LobbyQueryService extends Effect.Service<LobbyQueryService>()(
  "game/LobbyQueryService",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository; // Depends on TAG, not impl

      return {
        getLobbyState: (gameId: string) =>
          Effect.gen(function* () {
            const maybeGame = yield* gameRepository.findById(gameId);
            // ...
          }),
      };
    }),
    // NO dependencies - GameRepository provided by layer
  },
) {}
```

## Anti-patterns

```typescript
// BAD: Importing concrete implementation in service
import { DrizzleGameRepository } from "./infra/drizzle/drizzle-game.repository.js";

export class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.gen(function* () {
    // ...
  }),
  dependencies: [DrizzleGameRepository], // BAD: concrete dependency!
});

// GOOD: Import only the abstract Tag
import { GameRepository } from "./game.repository.js";

export class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.gen(function* () {
    const repo = yield* GameRepository; // Depends on abstraction
    // ...
  }),
  // No dependencies - let the layer provide them
});
```

```typescript
// BAD: Service directly using Drizzle/DB
export class LobbyQueryService extends Effect.Service<LobbyQueryService>()(..., {
  effect: Effect.gen(function* () {
    const db = yield* Database; // BAD: depends on concrete infrastructure!
    const result = yield* db.select().from(gamesTable);
    // ...
  }),
});

// GOOD: Use repository abstraction
export class LobbyQueryService extends Effect.Service<LobbyQueryService>()(..., {
  effect: Effect.gen(function* () {
    const gameRepository = yield* GameRepository; // Uses abstraction
    const game = yield* gameRepository.findById(gameId);
    // ...
  }),
});
```

## Checklist

- [ ] Service depends on `Context.Tag` interfaces, not concrete layers
- [ ] No `dependencies: [ConcreteImplementation]` in services
- [ ] Layer composition provides implementations at the application level
- [ ] Tests can easily swap implementations (InMemory vs Drizzle)
- [ ] Imports only abstract Tags in service files

## Examples

- [game.repository.ts](src/game/game.repository.ts) - Abstract repository interface (Tag)
- [lobby.query-service.ts](src/game/lobby.query-service.ts) - Query service depending on abstraction
- [index.ts](src/game/index.ts) - Layer composition providing implementations
