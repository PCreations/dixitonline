import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { GameDriver, makeGameDriverUnitTestLayer } from "./game.driver.js";

describe("Feature: Selecting a card when the turn is in the selecting-cards phase", () => {
  it.effect(
    "Example: A player can select a card from their hand",
    () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        yield* gameDriver.given.existingStartedGame({
          gameId: "id-game-1",
          currentStorytellerId: "id-player-2",
          currentTurn: {
            phase: "selecting-cards",
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

        yield* gameDriver.when.selectingCard({
          gameId: "id-game-1",
          playerId: "id-player-1",
          cardId: "id-card-2",
        });

        yield* gameDriver.assert.playerHandsToEqual({
          gameId: "id-game-1",
          playerHands: expect.arrayContaining([
            {
              playerId: "id-player-1",
              cards: [
                "id-card-1",
                "id-card-3",
                "id-card-4",
                "id-card-5",
                "id-card-6",
              ],
            },
          ]),
        });
        yield* gameDriver.assert.turnToHaveSelectedCards({
          gameId: "id-game-1",
          selectedCards: ["id-card-2"],
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );

  it.effect(
    "Example: A player cannot select a card that is not in their hand",
    () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        yield* gameDriver.given.existingStartedGame({
          gameId: "id-game-1",
          currentStorytellerId: "id-player-2",
          currentTurn: {
            phase: "selecting-cards",
          },
        });

        yield* gameDriver.when.selectingCard({
          gameId: "id-game-1",
          playerId: "id-player-1",
          cardId: "id-card-not-in-player-hand",
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToSelectCard({
          error: "The card is not in the player's hand",
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );

  it.effect(
    "Example: The storyteller cannot select a card",
    () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        yield* gameDriver.given.existingStartedGame({
          gameId: "id-game-1",
          currentStorytellerId: "id-player-1",
          currentTurn: {
            phase: "selecting-cards",
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

        yield* gameDriver.when.selectingCard({
          gameId: "id-game-1",
          playerId: "id-player-1",
          cardId: "id-card-7",
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToSelectCard({
          error: "The storyteller cannot select a card",
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );
});
