---
name: four-layer-testing
description: Four-Layer Testing Model inspired by Dave Farley. Use when setting up tests for a new domain module (e.g., player, lobby). Creates DSL-based acceptance tests with Driver pattern and Builder for scenarios.
---

# Four-Layer Testing Model

## Overview

This testing approach separates concerns into 4 distinct layers, making tests readable, maintainable, and focused on business behavior.

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: TEST SUITE                                        │
│  *.test.ts - Acceptance tests in business language          │
│  Uses: Given/When/Then pattern with Driver DSL              │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: DSL (Domain-Specific Language)                    │
│  {Module}DriverDSL interface - given/when/assert namespaces │
│  Exposes: Business-level operations                         │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: DRIVER                                            │
│  {Module}Driver implementation - Translates DSL to actions  │
│  Uses: Use cases, repositories, error capture               │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: APPLICATION                                       │
│  Use cases, entities, repositories (in-memory for tests)    │
│  The actual business logic being tested                     │
└─────────────────────────────────────────────────────────────┘
```

## Files Structure

For a module named `player`:

```
src/player/
├── player.entity.ts           # Domain entity
├── player.repository.ts       # Repository interface + InMemory
├── ensure-player-exists.usecase.ts
├── index.ts                   # Layer exports
└── tests/
    ├── player.driver.ts       # Driver + DSL + Test Layer factory
    ├── player.builder.ts      # Optional: fluent builder for scenarios
    ├── player.entity.test.ts  # Unit tests (no driver needed)
    └── ensure-player-exists.usecase.test.ts  # Acceptance tests
```

## Layer 1: Test Suite

Tests are written in business language using Given/When/Then:

```typescript
import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { PlayerDriver, makePlayerDriverTestLayer } from "./player.driver.js";

describe("Feature: Ensuring player exists", () => {
  it.effect("Example: Creating a new player when not exists", () =>
    Effect.gen(function* () {
      const driver = yield* PlayerDriver;

      // GIVEN - Setup (optional, may be empty)
      // No existing player

      // WHEN - Action
      yield* driver.when.ensuringPlayerExists({
        playerId: "player-1",
        username: "Alice",
        isAnonymous: true,
      });

      // THEN - Assertions
      yield* driver.assert.playerToExist({
        playerId: "player-1",
        username: "Alice",
      });
    }).pipe(Effect.provide(makePlayerDriverTestLayer())),
  );

  it.effect("Example: Updating username when player exists", () =>
    Effect.gen(function* () {
      const driver = yield* PlayerDriver;

      // GIVEN
      yield* driver.given.existingPlayer({
        playerId: "player-1",
        username: "Alice",
        isAnonymous: true,
      });

      // WHEN
      yield* driver.when.ensuringPlayerExists({
        playerId: "player-1",
        username: "Alicia",  // New username
        isAnonymous: true,
      });

      // THEN
      yield* driver.assert.playerToHaveUsername({
        playerId: "player-1",
        username: "Alicia",
      });
    }).pipe(Effect.provide(makePlayerDriverTestLayer())),
  );
});
```

## Layer 2: DSL Interface

Define business-level operations:

```typescript
interface PlayerDriverDSL {
  readonly given: {
    readonly existingPlayer: (props: {
      playerId: string;
      username: string;
      isAnonymous: boolean;
      email?: string;
    }) => Effect.Effect<void>;
  };

  readonly when: {
    readonly ensuringPlayerExists: (props: {
      playerId: string;
      username: string;
      isAnonymous: boolean;
    }) => Effect.Effect<void>;

    readonly linkingEmail: (props: {
      playerId: string;
      email: string;
    }) => Effect.Effect<void>;
  };

  readonly assert: {
    readonly playerToExist: (props: {
      playerId: string;
      username: string;
    }) => Effect.Effect<void>;

    readonly playerToHaveUsername: (props: {
      playerId: string;
      username: string;
    }) => Effect.Effect<void>;

    readonly playerToNotHaveBeenAbleToLinkEmail: (props?: {
      error?: string;
    }) => Effect.Effect<void>;
  };
}
```

### DSL Naming Conventions

| Namespace | Verb Form | Purpose |
|-----------|-----------|---------|
| `given`   | Noun/past participle | `existingPlayer`, `defaultDeck` |
| `when`    | Present participle (-ing) | `ensuringPlayerExists`, `joiningGame` |
| `assert`  | Infinitive with "To" | `playerToExist`, `playerToHaveUsername` |

### Error Assertions

For operations that can fail, use the pattern `{subject}ToNotHaveBeenAbleTo{Action}`:

```typescript
assert: {
  playerToNotHaveBeenAbleToJoinGame: (props?: { error?: string }) => ...,
  playerToNotHaveBeenAbleToLinkEmail: (props?: { error?: string }) => ...,
}
```

## Layer 3: Driver Implementation

The driver translates DSL to actual use case calls:

```typescript
import { Context, Effect, Layer, Option } from "effect";
import { expect } from "@effect/vitest";
import { PlayerId, PlayerEntity } from "../player.entity.js";
import { PlayerRepository } from "../player.repository.js";
import { EnsurePlayerExistsUseCase } from "../ensure-player-exists.usecase.js";

// 1. Effect Tag for dependency injection
export class PlayerDriver extends Context.Tag("PlayerDriver")<
  PlayerDriver,
  PlayerDriverDSL
>() {}

// 2. Driver factory
const makePlayerDriver = ({
  ensurePlayerExistsUseCase,
  playerRepository,
}: {
  ensurePlayerExistsUseCase: EnsurePlayerExistsUseCase;
  playerRepository: Context.Tag.Service<PlayerRepository>;
}): PlayerDriverDSL => {
  // Internal test state for error capture
  const testState = {
    currentError: Option.none<Error>(),
  };

  const given: PlayerDriverDSL["given"] = {
    existingPlayer: (props) =>
      Effect.gen(function* () {
        const player = PlayerEntity.createFromAuth({
          id: props.playerId,
          username: props.username,
          email: props.email,
          isAnonymous: props.isAnonymous,
        });
        yield* playerRepository.save(player);
      }),
  };

  const when: PlayerDriverDSL["when"] = {
    ensuringPlayerExists: (props) =>
      ensurePlayerExistsUseCase
        .execute({
          playerId: PlayerId(props.playerId),
          username: props.username,
          isAnonymous: props.isAnonymous,
        })
        .pipe(
          Effect.catchAll((error) => {
            // Capture error for later assertion
            testState.currentError = Option.some(error);
            return Effect.succeed(void 0);
          }),
        ),

    linkingEmail: (props) =>
      Effect.gen(function* () {
        const maybePlayer = yield* playerRepository.findById(
          PlayerId(props.playerId),
        );
        if (Option.isNone(maybePlayer)) {
          testState.currentError = Option.some(new Error("Player not found"));
          return;
        }
        const result = yield* maybePlayer.value
          .linkEmail(props.email)
          .pipe(Effect.either);
        // Handle result...
      }),
  };

  const assert: PlayerDriverDSL["assert"] = {
    playerToExist: (props) =>
      Effect.gen(function* () {
        const maybePlayer = yield* playerRepository.findById(
          PlayerId(props.playerId),
        );
        expect(Option.isSome(maybePlayer)).toBe(true);
        if (Option.isSome(maybePlayer)) {
          expect(maybePlayer.value.toSnapshot().username).toBe(props.username);
        }
      }),

    playerToHaveUsername: (props) =>
      Effect.gen(function* () {
        const maybePlayer = yield* playerRepository.findById(
          PlayerId(props.playerId),
        );
        expect(Option.isSome(maybePlayer)).toBe(true);
        expect(maybePlayer.value.toSnapshot().username).toBe(props.username);
      }),

    playerToNotHaveBeenAbleToLinkEmail: (props) =>
      Effect.sync(() => {
        expect(testState.currentError).toEqual(
          Option.some(new Error(props?.error)),
        );
      }),
  };

  return { given, when, assert };
};
```

### Error Capture Pattern

Actions don't fail the test immediately. Instead:
1. Errors are captured in `testState.currentError`
2. Tests use assertions like `playerToNotHaveBeenAbleToX` to verify errors

```typescript
const testState = {
  currentError: Option.none<Error>(),
};

// In when:
someAction: (props) =>
  useCase.execute(props).pipe(
    Effect.catchAll((error) => {
      testState.currentError = Option.some(error);
      return Effect.succeed(void 0);
    }),
  ),

// In assert:
playerToNotHaveBeenAbleToDoX: (props) =>
  Effect.sync(() => {
    expect(testState.currentError).toEqual(
      Option.some(new Error(props?.error)),
    );
  }),
```

## Layer 4: Test Layer Factory

Creates the complete test layer with in-memory implementations:

```typescript
export const makePlayerDriverTestLayer = () => {
  // In-memory dependencies for isolation
  const dependencies = Layer.mergeAll(
    InMemoryPlayerRepository,
    // ... other in-memory implementations
  );

  // Driver layer that uses use cases
  const driverLayer = Layer.effect(
    PlayerDriver,
    Effect.gen(function* () {
      const ensurePlayerExistsUseCase = yield* EnsurePlayerExistsUseCase;
      const playerRepository = yield* PlayerRepository;

      return makePlayerDriver({
        ensurePlayerExistsUseCase,
        playerRepository,
      });
    }),
  );

  return driverLayer.pipe(
    Layer.provide(EnsurePlayerExistsUseCase.Default),
    Layer.provide(dependencies),
  );
};
```

## Optional: Builder Pattern

For complex scenarios, create a fluent builder:

```typescript
export class PlayerBuilder {
  private config: PlayerConfig;

  constructor(playerId: string) {
    this.config = {
      playerId,
      username: "Anonymous",
      isAnonymous: true,
    };
  }

  withUsername(username: string): this {
    this.config.username = username;
    return this;
  }

  withEmail(email: string): this {
    this.config.email = email;
    this.config.isAnonymous = false;
    return this;
  }

  build(driver: PlayerDriverDSL): Effect.Effect<void> {
    return driver.given.existingPlayer(this.config);
  }
}

// Usage in tests:
yield* new PlayerBuilder("player-1")
  .withUsername("Alice")
  .withEmail("alice@example.com")
  .build(driver);
```

## Fail-Fast Mode (for Builders)

When building complex scenarios, errors in setup should fail immediately:

```typescript
const testState = {
  currentError: Option.none<Error>(),
  failFast: false,  // Toggle for builder mode
};

// In when actions:
joiningGame: (props) =>
  useCase.joinGame(props).pipe(
    Effect.catchAll((error) => {
      if (testState.failFast) {
        // Fail immediately during setup
        return Effect.die(new Error(`[Builder] ${error.message}`));
      }
      // Capture for later assertion during test
      testState.currentError = Option.some(error);
      return Effect.succeed(void 0);
    }),
  ),

// In builder:
build(driver: DriverDSL): Effect.Effect<void> {
  return Effect.gen(function* () {
    testState.failFast = true;
    yield* driver.given.existingPlayer(...);
    yield* driver.when.joiningGame(...);
    testState.failFast = false;
  });
}
```

## Checklist for New Module

1. [ ] Create `tests/` folder in module
2. [ ] Create `{module}.driver.ts`:
   - [ ] Define `{Module}DriverDSL` interface with `given`/`when`/`assert`
   - [ ] Create `{Module}Driver` Effect Tag
   - [ ] Implement `make{Module}Driver()` factory
   - [ ] Implement `make{Module}DriverTestLayer()` layer factory
3. [ ] Optional: Create `{module}.builder.ts` for complex scenarios
4. [ ] Create test files: `{feature}.test.ts`
5. [ ] Follow Given/When/Then pattern in all tests
6. [ ] End each test with `.pipe(Effect.provide(make{Module}DriverTestLayer()))`

## Examples

- [GameDriver](src/game/tests/game.driver.ts) - Complete driver with DSL
- [GameBuilder](src/game/tests/game.builder.ts) - Fluent builder for complex game scenarios
- [join-game.usecase.test.ts](src/game/tests/join-game.usecase.test.ts) - Simple tests
- [submit-clue.usecase.test.ts](src/game/tests/submit-clue.usecase.test.ts) - Tests with builder

## Benefits

1. **Readability**: Tests read like specifications
2. **Maintainability**: Change implementation without changing tests
3. **Reusability**: DSL actions compose for complex scenarios
4. **Isolation**: In-memory implementations ensure fast, deterministic tests
5. **Debugging**: Error capture pattern shows what failed without stack traces
