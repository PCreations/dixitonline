---
name: four-layer-testing
description: Four-Layer Testing Model inspired by Dave Farley. Use when setting up tests for a new domain module (e.g., player, lobby). Creates DSL-based acceptance tests with Driver pattern and Builder for scenarios.
---

# Four-Layer Testing Model

## Overview

This testing approach separates concerns into 4 distinct layers, making tests readable, maintainable, and focused on business behavior.

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: TEST CASES (Pure Effect Programs)                 │
│  test-cases/*.ts - Test logic as reusable Effect programs   │
│  Runner-agnostic: works with Vitest, Playwright, etc.       │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: TEST SUITES (Runner Adapters)                     │
│  test-suites/*.ts - Wraps test cases with runner (vitest)   │
│  channels/playwright/*.spec.ts - Playwright adapter         │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: DSL + DRIVER                                      │
│  {Module}DriverDSL interface - given/when/assert namespaces │
│  Multiple implementations: InMemory, Drizzle, Playwright    │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: APPLICATION                                       │
│  Use cases, entities, repositories                          │
│  The actual business logic being tested                     │
└─────────────────────────────────────────────────────────────┘
```

## Multi-Channel Architecture

Tests can run against different "channels" (infrastructure implementations):

```
                    ┌─────────────────────────┐
                    │   Test Cases            │
                    │   (Pure Effect programs)│
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  In-Memory    │     │    Drizzle      │     │   Playwright    │
│  Channel      │     │    Channel      │     │   E2E Channel   │
│  (unit tests) │     │  (integration)  │     │  (browser UI)   │
└───────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   InMemoryRepo           PostgreSQL              Browser + API
```

## Files Structure

For a module named `game`:

```
src/game/
├── game.entity.ts
├── game.repository.ts
├── create-game.usecase.ts
├── index.ts
└── tests/
    ├── game-driver.interface.ts     # DSL interface (runner-agnostic)
    ├── game.driver.ts               # In-memory driver implementation
    ├── game.builder.ts              # Fluent builder for scenarios
    │
    └── acceptance/
        ├── test-cases/              # Pure Effect programs
        │   └── create-game.test-cases.ts
        │
        ├── test-suites/             # Vitest adapters
        │   └── create-game.test-suite.ts
        │
        └── channels/
            ├── in-memory/           # Unit tests (fast, no I/O)
            │   └── create-game.usecase.test.ts
            │
            ├── drizzle/             # Integration tests (PostgreSQL)
            │   └── create-game.usecase.int.test.ts
            │
            └── playwright/          # E2E tests (browser)
                ├── playwright-game.driver.ts
                ├── playwright-test-utils.ts
                └── create-game.spec.ts
```

## Layer 1: Test Cases (Pure Effect Programs)

Test cases are **pure Effect programs** that are completely runner-agnostic. They can be executed with Vitest, Playwright, or any other test runner.

```typescript
// test-cases/create-game.test-cases.ts
import { Effect } from 'effect';
import { GameDriver } from '../../game-driver.interface.js';
import type { IdFactory } from '../test-suites/create-game.test-suite.js';

export interface TestCase<R = GameDriver> {
  readonly name: string;
  readonly program: (idFactory: IdFactory) => Effect.Effect<void, unknown, R>;
  /**
   * Skip this test in certain channels.
   * E.g., custom deck selection is not available in Playwright UI.
   */
  readonly skipChannels?: ReadonlyArray<'playwright' | 'in-memory' | 'drizzle'>;
}

export const createGameTestCases: ReadonlyArray<TestCase> = [
  {
    name: 'Creating a new game with the default deck and settings',
    program: (idFactory) =>
      Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        // GIVEN
        yield* gameDriver.given.defaultDeck({
          id: idFactory.deckId(1),
        });

        // WHEN
        yield* gameDriver.when.creatingGame({
          gameId: idFactory.gameId(1),
          hostId: idFactory.playerId(1),
        });

        // THEN
        yield* gameDriver.assert.createdGameToEqual({
          id: idFactory.gameId(1),
          createdBy: idFactory.playerId(1),
          deckId: idFactory.deckId(1),
          players: [idFactory.playerId(1)],
        });
      }),
  },
  {
    name: 'Creating a new game with a custom deck',
    skipChannels: ['playwright'], // Custom deck selection not available in UI
    program: (idFactory) =>
      Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        yield* gameDriver.given.existingDeck({ id: idFactory.deckId(2) });
        yield* gameDriver.when.creatingGame({
          gameId: idFactory.gameId(1),
          hostId: idFactory.playerId(1),
          deckId: idFactory.deckId(2),
        });
        yield* gameDriver.assert.createdGameToEqual({
          id: idFactory.gameId(1),
          createdBy: idFactory.playerId(1),
          deckId: idFactory.deckId(2),
          players: [idFactory.playerId(1)],
        });
      }),
  },
];
```

### IdFactory Pattern

The `IdFactory` generates IDs appropriate for each channel:

```typescript
// For in-memory tests: simple string IDs
export const defaultIdFactory: IdFactory = {
  gameId: (id) => `id-game-${id}`,
  playerId: (id) => `id-player-${id}`,
  deckId: (id) => `id-deck-${id}`,
};

// For PostgreSQL/Playwright: valid UUIDs
import { gameId, playerId, deckId } from '../uuid-test-helper.js';

export const uuidIdFactory: IdFactory = {
  gameId: (id) => gameId(Number(id)),     // "00000000-0000-0000-0000-000000000001"
  playerId: (id) => playerId(Number(id)), // "10000000-0000-0000-0000-000000000001"
  deckId: (id) => deckId(Number(id)),     // "20000000-0000-0000-0000-000000000001"
};
```

## Layer 2: Test Suites (Runner Adapters)

Test suites wrap test cases with a specific test runner.

### Vitest Adapter (for in-memory and drizzle channels)

```typescript
// test-suites/create-game.test-suite.ts
import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import type { GameDriverLayer } from '../../game.driver.js';
import { createGameTestCases } from '../test-cases/create-game.test-cases.js';

export interface IdFactory {
  gameId: (id: string | number) => string;
  playerId: (id: string | number) => string;
  deckId: (id: string | number) => string;
}

export const createGameTestSuite = (
  makeGameDriverTestLayer: () => GameDriverLayer,
  idFactory: IdFactory = defaultIdFactory,
) => {
  describe('Feature: Creating a new game', () => {
    for (const testCase of createGameTestCases) {
      it.effect(`Example: ${testCase.name}`, () => {
        return testCase
          .program(idFactory)
          .pipe(Effect.provide(makeGameDriverTestLayer()));
      });
    }
  });
};
```

### Playwright Adapter (for E2E channel)

```typescript
// channels/playwright/create-game.spec.ts
import { test } from '@playwright/test';
import { Effect } from 'effect';
import { GameDriver } from '../../../game-driver.interface.js';
import { createGameTestCases } from '../../test-cases/create-game.test-cases.js';
import { makePlaywrightGameDriver } from './playwright-game.driver.js';

// Each test gets unique IDs to avoid conflicts
const createUuidIdFactory = (testIndex: number): IdFactory => {
  const offset = testIndex * 100;
  return {
    gameId: (id) => gameId(Number(id) + offset),
    playerId: (id) => playerId(Number(id) + offset),
    deckId: (id) => deckId(Number(id) + offset),
  };
};

test.describe('E2E: Create Game', () => {
  test.beforeEach(async () => {
    await resetDatabase(); // Reset game data between tests
  });

  let testIndex = 0;
  for (const testCase of createGameTestCases) {
    const currentTestIndex = testIndex++;

    // Skip tests not supported via Playwright
    if (testCase.skipChannels?.includes('playwright')) {
      test.skip(`Example: ${testCase.name}`, () => {});
      continue;
    }

    test(`Example: ${testCase.name}`, async ({ page }) => {
      const driver = makePlaywrightGameDriver(page);
      const uuidIdFactory = createUuidIdFactory(currentTestIndex);

      await Effect.runPromise(
        testCase.program(uuidIdFactory).pipe(
          Effect.provideService(GameDriver, driver as any),
        ),
      );
    });
  }
});
```

## Layer 3: DSL Interface

The DSL interface is defined **without test framework dependencies**. Define business-level operations:

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

## Playwright Driver Implementation

For E2E testing, implement a driver that uses browser interactions via Playwright:

```typescript
// channels/playwright/playwright-game.driver.ts
import { Effect, Option } from 'effect';
import type { Page } from '@playwright/test';
import type { GameDriverDSL } from '../../game-driver.interface.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3010';

export const makePlaywrightGameDriver = (page: Page): GameDriverDSL => {
  const testState = {
    currentError: Option.none<Error>(),
    failFast: false,
  };

  // Helper for HTTP backdoor calls (setup data not available in UI)
  const httpPost = <T>(url: string, body: object): Effect.Effect<T, Error> =>
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(`${BASE_URL}${url}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as T;
      },
      catch: (e) => new Error(String(e)),
    });

  // Helper for UI interactions
  const uiAction = (fn: () => Promise<void>): Effect.Effect<void, Error> =>
    Effect.tryPromise({ try: fn, catch: (e) => new Error(String(e)) });

  const given: GameDriverDSL['given'] = {
    // Use backdoor API for data setup (no UI for decks)
    defaultDeck: (props) =>
      httpPost('/api/test/setup/deck', { ...props, isDefault: true }),

    existingDeck: (props) =>
      httpPost('/api/test/setup/deck', props),
  };

  const when: GameDriverDSL['when'] = {
    // Use UI for actual user actions
    creatingGame: (props) =>
      uiAction(async () => {
        await page.goto(`${BASE_URL}`);
        await page.fill('input[placeholder="Pseudo"]', props.hostId);
        await page.click('button[type="submit"]');
        await page.click('text=Créer une partie');
        await page.click('button:has-text("Créer la partie")');
        await page.waitForURL(/\/game\/.*\/lobby/);
      }).pipe(
        Effect.catchAll((error) => {
          if (testState.failFast) {
            return Effect.die(new Error(`[PlaywrightDriver] ${error.message}`));
          }
          testState.currentError = Option.some(error);
          return Effect.succeed(void 0);
        }),
      ),
  };

  const assert: GameDriverDSL['assert'] = {
    createdGameToEqual: (expected) =>
      uiAction(async () => {
        const { expect } = await import('@playwright/test');
        await expect(page.locator('[data-testid="host-name"]'))
          .toContainText(expected.createdBy);
        await expect(page.locator('[data-testid="player-count"]'))
          .toContainText(`${expected.players.length}/6`);
      }),
  };

  return { given, when, assert };
};
```

### Backdoor API Pattern

Some test setup cannot be done via UI (e.g., creating decks). Use backdoor API routes:

```typescript
// src/http/routes/test.routes.ts (only in non-production)
if (process.env.NODE_ENV !== 'production') {
  fastify.post('/api/test/setup/deck', async (request) => {
    // Create deck directly in database
  });
}
```

## Checklist for New Module

### Basic Setup (Single Channel)

1. [ ] Create `tests/` folder in module
2. [ ] Create `{module}-driver.interface.ts`:
   - [ ] Define `{Module}DriverDSL` interface with `given`/`when`/`assert`
   - [ ] Create `{Module}Driver` Effect Tag
3. [ ] Create `{module}.driver.ts`:
   - [ ] Implement `make{Module}Driver()` factory
   - [ ] Implement `make{Module}DriverTestLayer()` layer factory
4. [ ] Optional: Create `{module}.builder.ts` for complex scenarios
5. [ ] Create test files: `{feature}.usecase.test.ts`

### Multi-Channel Setup (In-Memory + Drizzle + Playwright)

1. [ ] Create `tests/acceptance/` folder structure:
   ```
   tests/acceptance/
   ├── test-cases/           # Pure Effect programs
   ├── test-suites/          # Vitest adapters
   └── channels/
       ├── in-memory/
       ├── drizzle/
       └── playwright/
   ```
2. [ ] Create test cases in `test-cases/{feature}.test-cases.ts`:
   - [ ] Define `TestCase` interface with `name`, `program`, optional `skipChannels`
   - [ ] Export test cases as `ReadonlyArray<TestCase>`
3. [ ] Create test suite in `test-suites/{feature}.test-suite.ts`:
   - [ ] Define `IdFactory` interface
   - [ ] Create suite function that iterates over test cases
4. [ ] Create channel-specific files:
   - [ ] `channels/in-memory/{feature}.usecase.test.ts`
   - [ ] `channels/drizzle/{feature}.usecase.int.test.ts`
   - [ ] `channels/playwright/{feature}.spec.ts`
5. [ ] Create Playwright driver if needed:
   - [ ] `channels/playwright/playwright-{module}.driver.ts`
   - [ ] Use `uiAction()` helper for browser interactions
   - [ ] Use `httpPost()` helper for backdoor API calls

## Examples

### Multi-Channel Architecture (Recommended)

- [create-game.test-cases.ts](src/game/tests/acceptance/test-cases/create-game.test-cases.ts) - Pure Effect test cases
- [create-game.test-suite.ts](src/game/tests/acceptance/test-suites/create-game.test-suite.ts) - Vitest adapter
- [channels/in-memory/create-game.usecase.test.ts](src/game/tests/acceptance/channels/in-memory/create-game.usecase.test.ts) - In-memory tests
- [channels/drizzle/create-game.usecase.int.test.ts](src/game/tests/acceptance/channels/drizzle/create-game.usecase.int.test.ts) - Integration tests
- [channels/playwright/create-game.spec.ts](src/game/tests/acceptance/channels/playwright/create-game.spec.ts) - E2E tests
- [channels/playwright/playwright-game.driver.ts](src/game/tests/acceptance/channels/playwright/playwright-game.driver.ts) - Playwright driver

### Core Components

- [game-driver.interface.ts](src/game/tests/game-driver.interface.ts) - DSL interface definition
- [game.driver.ts](src/game/tests/game.driver.ts) - In-memory driver implementation
- [game.builder.ts](src/game/tests/game.builder.ts) - Fluent builder for complex game scenarios

## Benefits

1. **Readability**: Tests read like specifications with Given/When/Then
2. **Maintainability**: Change implementation without changing test logic
3. **Reusability**: Same test cases run across all channels (in-memory, PostgreSQL, browser)
4. **Isolation**: In-memory implementations ensure fast, deterministic tests
5. **Debugging**: Error capture pattern shows what failed without stack traces
6. **Multi-Channel**: Write once, test at multiple levels (unit, integration, E2E)
7. **Skip Pattern**: Use `skipChannels` to exclude tests not available in certain channels
8. **Type-safe**: Effect provides compile-time guarantees on test structure
