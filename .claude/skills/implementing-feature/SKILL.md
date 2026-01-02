---
name: implementing-feature
description: Implements features following DDD and hexagonal architecture. Use cases are orchestrators only - load aggregate, delegate logic, save. All mutations wrapped in transactions with optimistic retry. Triggers on "feature", "fonctionnalité", "implémenter", "DDD", "aggregate".
---

# Implementing Features (DDD + Hexagonal)

## Core Principle

**Use Case = Orchestrator ONLY**

```
Load Aggregate Root → Delegate Business Logic → Save
```

Use cases have **ZERO business logic**. They only:
1. Load the aggregate root from repository
2. Call a method on the aggregate (business logic lives there)
3. Save the updated aggregate
4. Wrap everything in transaction with optimistic retry

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│  Infrastructure (Routes, DB, External APIs)    │
├─────────────────────────────────────────────────┤
│  Use Cases (Orchestration ONLY)                 │
├─────────────────────────────────────────────────┤
│  Domain (Entities, Value Objects, Rules)        │
│  ← ALL business logic lives here                │
├─────────────────────────────────────────────────┤
│  Ports (Repository interfaces)                  │
└─────────────────────────────────────────────────┘
```

## Use Case Pattern

```typescript
// src/game/{action}.usecase.ts
export class {Action}UseCase extends Effect.Service<{Action}UseCase>()(
  "game/{Action}UseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository; // Depends on abstraction!

      return {
        execute: (command: {Action}Command) => {
          // Transaction logic - will be retried on optimistic concurrency error
          const transactionLogic = Effect.gen(function* () {
            // 1. LOAD aggregate root
            const maybeGame = yield* gameRepository.findById(command.gameId);
            const game = yield* Option.match(maybeGame, {
              onNone: () => Effect.fail(new GameNotFound({ gameId: command.gameId })),
              onSome: Effect.succeed,
            });

            // 2. DELEGATE to aggregate (NO logic here!)
            const updatedGame = yield* game.doSomething(command);

            // 3. SAVE
            yield* gameRepository.save(updatedGame);
          });

          // Wrap in optimistic retry
          return withOptimisticRetry(transactionLogic);
        },
      };
    }),
    // No dependencies - GameRepository provided by layer composition
  },
) {}
```

## Aggregate Root Pattern

Business logic lives in the entity, NOT in the use case.

```typescript
// src/game/game.entity.ts
export class StartedGameEntity extends GameEntity {

  // Business logic method - called by use case
  submitClue(opts: { playerId: PlayerId; cardId: CardId; clue: string }) {
    return Effect.gen(this, function* () {
      // Validation rules
      if (this.props.currentTurn.currentStorytellerId !== opts.playerId) {
        return yield* Effect.fail(new NotTheStoryteller());
      }

      // State transition
      const updatedTurn = yield* this.props.currentTurn.submitClue({
        playerId: opts.playerId,
        clue: opts.clue,
        cardId: opts.cardId,
      });

      // Return new immutable instance
      return StartedGameEntity.create({
        ...this.props,
        currentTurn: updatedTurn,
        version: this.props.version + 1,
      });
    });
  }
}
```

## Optimistic Concurrency

All use cases MUST use `withOptimisticRetry`:

```typescript
import { withOptimisticRetry } from "./optimistic-retry.js";

// In use case
return {
  execute: (command) => {
    const logic = Effect.gen(function* () {
      const game = yield* gameRepository.findById(command.gameId);
      const updated = yield* game.doAction(command);
      yield* gameRepository.save(updated); // May throw OptimisticConcurrencyError
    });

    return withOptimisticRetry(logic); // Retries up to 3 times
  },
};
```

Repository save checks version:

```typescript
// In repository implementation
save: (game) => Effect.gen(function* () {
  const result = yield* db.update(gamesTable)
    .set({ data: encode(game), version: game.version + 1 })
    .where(and(
      eq(gamesTable.id, game.id),
      eq(gamesTable.version, game.version), // Optimistic lock
    ));

  if (result.rowCount === 0) {
    return yield* Effect.fail(new OptimisticConcurrencyError({ gameId: game.id }));
  }
});
```

## Implementation Checklist

### 1. Domain Layer (Entity)

```typescript
// Add method to aggregate root
class GameEntity {
  doAction(opts: ActionOpts) {
    return Effect.gen(this, function* () {
      // 1. Validate invariants
      if (!this.canDoAction()) {
        return yield* Effect.fail(new CannotDoAction());
      }

      // 2. Apply state change
      const newState = { ...this.props, /* changes */ };

      // 3. Return new immutable instance
      return this.createInstance({
        ...newState,
        version: this.props.version + 1,
      });
    });
  }
}
```

### 2. Use Case Layer

```typescript
// Create use case - orchestration only
export class DoActionUseCase extends Effect.Service<DoActionUseCase>()(
  "game/DoActionUseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository; // Abstraction!

      return {
        execute: (command) => {
          const logic = Effect.gen(function* () {
            const game = yield* loadGame(gameRepository, command.gameId);
            const updated = yield* game.doAction(command);
            yield* gameRepository.save(updated);
          });

          return withOptimisticRetry(logic);
        },
      };
    }),
    // No dependencies - provided by layer
  },
) {}
```

### 3. Register in Layer

```typescript
// src/game/index.ts
export const GameLayerLive = Layer.mergeAll(
  // ... existing use cases
  DoActionUseCase.Default,
);
```

### 4. Add Route

```typescript
// src/server.ts - thin controller
fastify.route({
  method: "POST",
  url: "/game/:gameId/action",
  handler: async (request, reply) => {
    const program = Effect.gen(function* () {
      const useCase = yield* DoActionUseCase;
      yield* useCase.execute({ gameId, ...body });
      // redirect...
    });
    return appRuntime.runPromise(program);
  },
});
```

### 5. Write Tests

```typescript
// src/game/tests/do-action.usecase.test.ts
it.effect("Example: successful action", () => {
  return Effect.gen(function* () {
    const gameDriver = yield* GameDriver;

    yield* gameDriver.given.existingGame(...);
    yield* gameDriver.when.doingAction(...);
    yield* gameDriver.assert.actionWasSuccessful(...);
  }).pipe(Effect.provide(makeGameDriverTestLayer()));
});
```

## Anti-patterns

```typescript
// BAD: Business logic in use case
execute: (command) => Effect.gen(function* () {
  const game = yield* gameRepository.findById(command.gameId);

  // NO! This belongs in the entity
  if (game.players.length < 3) {
    return yield* Effect.fail(new NotEnoughPlayers());
  }

  // NO! State mutation belongs in entity
  const updatedGame = {
    ...game,
    status: "started",
  };

  yield* gameRepository.save(updatedGame);
});

// GOOD: Delegate to aggregate
execute: (command) => Effect.gen(function* () {
  const game = yield* gameRepository.findById(command.gameId);
  const updatedGame = yield* game.start(command); // Entity handles logic
  yield* gameRepository.save(updatedGame);
});
```

```typescript
// BAD: Missing optimistic retry
execute: (command) => Effect.gen(function* () {
  // ... logic without retry wrapper
});

// GOOD: Always wrap in optimistic retry
execute: (command) => {
  const logic = Effect.gen(function* () { /* ... */ });
  return withOptimisticRetry(logic);
};
```

## Examples

- [submit-clue.usecase.ts](src/game/submit-clue.usecase.ts) - Storyteller submits clue
- [vote-on-card.usecase.ts](src/game/vote-on-card.usecase.ts) - Player votes on card
- [start-game.usecase.ts](src/game/start-game.usecase.ts) - Host starts game
