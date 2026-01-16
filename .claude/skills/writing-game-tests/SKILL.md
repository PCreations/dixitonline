---
name: writing-game-tests
description: Writes tests using GameDriver DSL with Given/When/Then pattern and @effect/vitest. Use when creating tests for game use cases, scenarios, or view projectors. Triggers on "test", "spec", "GameDriver", "Given/When/Then".
---

# Writing Game Tests

## Framework

Uses `@effect/vitest` for Effect-native testing with `it.effect()`.

## Test Structure

```typescript
import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { GameDriver, makeGameDriverTestLayer } from "./game.driver.js";
import { GameBuilder } from "./game.builder.js";

describe("Feature: {FeatureName}", () => {
  it.effect("Example: {scenario description}", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      // GIVEN - Setup
      yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder("id-game-1")
          .hostedBy("id-player-1")
          .withPlayers("id-player-1", "id-player-2", "id-player-3")
          .started(),
      );

      // WHEN - Action
      yield* gameDriver.when.submittingClue({
        gameId: "id-game-1",
        playerId: "id-player-1",
        cardId: "card-1",
        clue: "A mysterious clue",
      });

      // THEN - Assert
      yield* gameDriver.assert.turnClueToBeSubmitted({
        gameId: "id-game-1",
        expectedClue: "A mysterious clue",
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });
});
```

## GameDriver DSL

### Given (Setup)

```typescript
// Create deck
yield* gameDriver.given.defaultDeck({ deckId: "id-deck-1" });
yield* gameDriver.given.existingDeck({ id: "id-deck-1", cards: [...] });

// Create game with builder
yield* gameDriver.given.existingGame(gameDriver, builder);

// Create non-started game directly
yield* gameDriver.given.existingNonStartedGame({
  gameId: "id-game-1",
  hostId: "id-player-1",
  players: ["id-player-1", "id-player-2"],
});

// Create full game (6 players)
yield* gameDriver.given.existingFullGame({
  gameId: "id-game-1",
  hostId: "id-player-1",
});
```

### When (Actions)

```typescript
yield* gameDriver.when.creatingGame({ gameId, hostId });
yield* gameDriver.when.joiningGame({ gameId, playerId });
yield* gameDriver.when.startingGame({ gameId, playerId });
yield* gameDriver.when.submittingClue({ gameId, playerId, cardId, clue });
yield* gameDriver.when.selectingCard({ gameId, playerId, cardId });
yield* gameDriver.when.votingOnCard({ gameId, playerId, cardId });
yield* gameDriver.when.notifyingToBeReadyForNextTurn({ gameId, playerId });
```

### Assert (Verification)

```typescript
yield* gameDriver.assert.createdGameToEqual(game);
yield* gameDriver.assert.playerToHaveJoinedGame({ gameId, playerId });
yield* gameDriver.assert.playerToNotHaveBeenAbleToJoinGame({ gameId, playerId, reason });
yield* gameDriver.assert.gameToHavePlayers({ gameId, expectedPlayers });
yield* gameDriver.assert.gameToHaveBeenStarted({ gameId });
yield* gameDriver.assert.turnClueToBeSubmitted({ gameId, expectedClue });
yield* gameDriver.assert.turnToHaveSelectedCards({ gameId, expectedCards });
yield* gameDriver.assert.playersToHaveScore({ gameId, expectedScores });
```

## GameBuilder Fluent API

```typescript
new GameBuilder("id-game-1")
  .hostedBy("id-player-1")
  .withDeck("id-deck-1")
  .withDeckCards({ deckId: "id-deck-1", cards: ["card-1", "card-2", ...] })
  .withPlayers("id-player-1", "id-player-2", "id-player-3")
  .withEndCondition({ type: "LimitOfPoints", limit: 30 })
  .started()
  .withSubmittedClueOnCardIndex("A clue", 0)
  .withSelectedCards([
    { playerId: "id-player-2", cardIndex: 0 },
    { playerId: "id-player-3", cardIndex: 0 },
  ])
  .withVotedCards([
    { playerId: "id-player-2", cardSelectedByPlayer: "id-player-1" },
    { playerId: "id-player-3", cardSelectedByPlayer: "id-player-2" },
  ])
  .withScores([
    { playerId: "id-player-1", score: 3 },
    { playerId: "id-player-2", score: 4 },
  ])
  .withPlayersReadyForNextTurn(["id-player-1", "id-player-2"])
  .inScoringPhaseSince(new Date())
```

## Helper Functions

```typescript
import {
  getCardsInDrawPile,
  getCurrentStorytellerId,
  getStorytellerCardId,
  getCardInHandByIndex,
  getSelectedCardsByPlayer,
  getPlayerHand,
} from "./game.builder.js";

// Get storyteller for current turn
const storytellerId = getCurrentStorytellerId(gameSnapshot);

// Get a card from player's hand by index
const card = getCardInHandByIndex(gameSnapshot, { playerId, cardIndex: 0 });
```

## Fail-Fast Mode

For complex scenarios, use fail-fast mode to catch errors during setup:

```typescript
it.effect("Complex scenario", () => {
  return Effect.gen(function* () {
    const gameDriver = yield* GameDriver;
    yield* gameDriver.withFailFastMode();

    // Setup - errors will fail immediately
    yield* gameDriver.given.existingGame(...);

    // Test continues only if setup succeeded
    yield* gameDriver.when.doingSomething(...);
  }).pipe(Effect.provide(makeGameDriverTestLayer()));
});
```

## Examples

### Testing Error Cases

```typescript
it.effect("Example: Player cannot join a full game", () => {
  return Effect.gen(function* () {
    const gameDriver = yield* GameDriver;

    yield* gameDriver.given.existingFullGame({
      gameId: "id-game-1",
      hostId: "id-player-1",
    });

    yield* gameDriver.when.joiningGame({
      gameId: "id-game-1",
      playerId: "id-player-7",
    });

    yield* gameDriver.assert.playerToNotHaveBeenAbleToJoinGame({
      gameId: "id-game-1",
      playerId: "id-player-7",
      reason: "Game is full",
    });
  }).pipe(Effect.provide(makeGameDriverTestLayer()));
});
```

### Testing View Projector

```typescript
it.effect("Example: lobby phase projection", () => {
  return Effect.gen(function* () {
    const gameDriver = yield* GameDriver;
    const { game } = yield* gameDriver.given.existingGame(
      gameDriver,
      new GameBuilder("id-game-1")
        .hostedBy("id-player-1")
        .withPlayers("id-player-1", "id-player-2"),
    );

    const gameViewProjector = yield* GameViewProjector;
    const views = yield* gameViewProjector.projectLobby(game);

    expect(views["id-player-1"]).toEqual({
      gameId: "id-game-1",
      phase: "lobby",
      isHost: true,
      canStart: false,
      // ...
    });
  }).pipe(Effect.provide(makeGameDriverTestLayer()));
});
```

## File Locations

- Tests: `src/game/tests/{feature}.test.ts`
- Driver Interface: [game-driver.interface.ts](src/game/tests/game-driver.interface.ts)
- Driver Implementation: [game.driver.ts](src/game/tests/game.driver.ts)
- Builder: [game.builder.ts](src/game/tests/game.builder.ts)

## Checklist

1. Create test file: `src/game/tests/{feature}.test.ts`
2. Import `@effect/vitest`, `GameDriver`, `GameBuilder`
3. Use `it.effect()` for Effect-based tests
4. Follow Given/When/Then pattern
5. End with `.pipe(Effect.provide(makeGameDriverTestLayer()))`

## Multi-Channel Testing

For tests that need to run across multiple channels (in-memory, PostgreSQL, Playwright E2E), see the **four-layer-testing** skill which explains the test-cases/test-suites architecture:

```
src/game/tests/acceptance/
├── test-cases/     # Pure Effect programs (runner-agnostic)
├── test-suites/    # Vitest adapters
└── channels/       # Channel-specific test files
    ├── in-memory/
    ├── drizzle/
    └── playwright/
```
