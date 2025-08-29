import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { GameDriver, makeGameDriverUnitTestLayer } from "./game.driver.js";

describe("Feature: Submitting the storyteller's clue", () => {
  it.effect("Example: The storyteller can submit a clue on one of their cards", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      yield* gameDriver.given.existingStartedGame({
        gameId: "id-game-1",
        hostId: "id-player-1",
        currentStorytellerId: "id-player-1",
        currentTurn: {
          phase: "storytelling",
        },
        playerHands: {
          "id-player-1": {
            cards: [
              "id-card-1",
              "id-card-2",
              "id-card-3",
              "id-card-4",
              "id-card-5",
              "id-card-6",
            ],
          },
        },
      });

      yield* gameDriver.when.submittingClue({
        gameId: "id-game-1",
        playerId: "id-player-1",
        cardId: "id-card-1",
        clue: "A clue",
      });

      yield* gameDriver.assert.turnClueToBeSubmitted({
        gameId: "id-game-1",
        storytellerClue: "A clue",
        storytellerCardId: "id-card-1",
      });
    }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
  });

  it.effect("Example: The storyteller cannot submit a clue on a card they don't have", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      yield* gameDriver.given.existingStartedGame({
        gameId: "id-game-1",
        hostId: "id-player-1",
        currentStorytellerId: "id-player-1",
        currentTurn: {
          phase: "storytelling",
        },
        playerHands: {
          "id-player-1": {
            cards: [
              "id-card-1",
              "id-card-2",
              "id-card-3",
              "id-card-4",
              "id-card-5",
              "id-card-6",
            ],
          },
        },
      });

      yield* gameDriver.when.submittingClue({
        gameId: "id-game-1",
        playerId: "id-player-1",
        cardId: "id-card-7",
        clue: "A clue",
      });

      yield* gameDriver.assert.playerToNotHaveBeenAbleToSubmitClue({
        error: "The storyteller cannot submit a clue on a card they don't have",
      });
    }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
  });

  it.effect("Example: Only the current storyteller can submit a clue", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      yield* gameDriver.given.existingStartedGame({
        gameId: "id-game-1",
        hostId: "id-player-1",
        currentStorytellerId: "id-player-1",
        currentTurn: {
          phase: "storytelling",
        },
      });

      yield* gameDriver.when.submittingClue({
        gameId: "id-game-1",
        playerId: "id-player-2",
        cardId: "id-card-7",
        clue: "A clue",
      });

      yield* gameDriver.assert.playerToNotHaveBeenAbleToSubmitClue({
        error: "Only the storyteller can submit a clue",
      });
    }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
  });
});
