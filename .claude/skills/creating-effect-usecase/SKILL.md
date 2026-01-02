---
name: creating-effect-usecase
description: Creates Effect use cases following the project's hexagonal architecture pattern. Use when adding new business logic, game actions, or domain operations. Triggers on "use case", "usecase", "action métier", "nouvelle fonctionnalité".
---

# Creating Effect Use Cases

## Pattern

```typescript
// src/game/{name}.usecase.ts
import { Effect, Layer, Option, Either } from "effect";
import { GameRepository } from "./game.repository.js";
import type { GameId, PlayerId } from "./game.entity.js";

// 1. Command type
interface {Name}Command {
  readonly gameId: GameId;
  readonly playerId: PlayerId;
  // ... other props
}

// 2. Service class
export class {Name}UseCase extends Effect.Service<{Name}UseCase>()(
  "game/{Name}UseCase",
  {
    effect: Effect.gen(function* () {
      // Depend on ABSTRACTIONS (Context.Tag), not concretions
      const gameRepository = yield* GameRepository;
      // yield* other dependencies...

      return {
        {methodName}: (command: {Name}Command) =>
          Effect.gen(function* () {
            // Load entity
            const maybeGame = yield* gameRepository.findById(command.gameId);

            // Handle Option
            return yield* Option.match(maybeGame, {
              onNone: () => Effect.fail(new GameNotFound({ gameId: command.gameId })),
              onSome: (game) =>
                Effect.gen(function* () {
                  // Business logic
                  const updated = game.someMethod(command);
                  yield* gameRepository.save(updated);
                  return Either.right({ success: true });
                }),
            });
          }),
      };
    }),
    // NO dependencies - implementations provided by layer composition
    // See effect-dependencies skill for details
  },
) {}
```

## Checklist

1. Create `src/game/{kebab-name}.usecase.ts`
2. Define command interface with branded types
3. Extend `Effect.Service` with service ID `"game/{Name}UseCase"`
4. Inject dependencies via `yield*`
5. Return object with method(s)
6. Add to `GameLayerLive` in [index.ts](src/game/index.ts)
7. Write tests in `src/game/tests/{name}.usecase.test.ts`

## Dependencies

**Depend on ABSTRACTIONS (Context.Tag), not concretions.**

Use cases should `yield*` abstract Tags:
- `GameRepository` (not `DrizzleGameRepository` or `InMemoryGameRepository`)
- `DeckRepository` (not `JsonDeckRepository`)
- `GameViewProjector`
- `ShufflerService`

The APPLICATION layer (`index.ts`) is responsible for providing concrete implementations.

## Error Handling

```typescript
import { Data } from "effect";

export class {ErrorName} extends Data.TaggedError("{ErrorName}")<{
  readonly gameId: GameId;
  readonly reason?: string;
}> {}
```

## Layer Registration

```typescript
// src/game/index.ts
export const GameLayerLive = Layer.mergeAll(
  // ... existing use cases
  {Name}UseCase.Default,
);

export const GameLayerWithoutDependencies = Layer.mergeAll(
  // ... existing use cases
  {Name}UseCase.DefaultWithoutDependencies,
);
```

## Optimistic Locking

For concurrent operations, wrap with retry:

```typescript
import { withOptimisticRetry } from "./with-optimistic-retry.js";

return {
  methodName: (command: Command) => {
    const logic = Effect.gen(function* () {
      // ... business logic
    });
    return withOptimisticRetry(logic);
  },
};
```
