import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { GameDriver, makeGameDriverUnitTestLayer } from "./game.driver.js";

describe("Feature: Starting a game", () => {
  describe("Scenario: Starting a game with different configurations", () => {
    it.effect("Example: Starting a game when the minimum number of players is reached", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGameWithMinimumNumberOfPlayers({
          gameId: "id-game-1",
          hostId: "id-player-1",
        });

        yield* gameDriver.when.startingGame({
          gameId: "id-game-1",
          playerId: "id-player-1",
        });

        yield* gameDriver.assert.gameToHaveBeenStarted({
          gameId: "id-game-1",
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    });

    it.effect("Example: Only the host can start the game", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGameWithMinimumNumberOfPlayers({
          gameId: "id-game-1",
          hostId: "id-player-1",
        });

        yield* gameDriver.when.startingGame({
          gameId: "id-game-1",
          playerId: "id-player-2",
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
          error: "Only the host can start the game",
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    });

    it.effect("Example: Cannot start a game if the game does not meet the minimum number of players", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGame({
          gameId: "id-game-1",
          hostId: "id-player-1",
          players: ["id-player-1", "id-player-2"],
        });

        yield* gameDriver.when.startingGame({
          gameId: "id-game-1",
          playerId: "id-player-1",
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
          error: "The game does not meet the minimum number of players",
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    });

    it.effect("Example: A player not in game cannot start it", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGameWithMinimumNumberOfPlayers({
          gameId: "id-game-1",
          hostId: "id-player-1",
        });

        yield* gameDriver.when.startingGame({
          gameId: "id-game-1",
          playerId: "id-player-not-in-game",
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
          error: "Player not in game",
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    });

    it.effect("Example: A player can not start the game if the game is already started", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGameWithMinimumNumberOfPlayers({
          gameId: "id-game-1",
          hostId: "id-player-1",
          started: true,
        });

        yield* gameDriver.when.startingGame({
          gameId: "id-game-1",
          playerId: "id-player-1",
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
          error: "Game already started",
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    });

    it.effect("Example: Optimistic concurrency: A player cannot start a game if a player has left in between at the time of starting, making the game not meet the minimum number of players", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGame({
          gameId: "id-game-1",
          hostId: "id-player-1",
          players: ["id-player-1", "id-player-2", "id-player-3"],
        });

        yield* gameDriver.when.startingGameWhileAnotherPlayerLeftInBetween({
          gameId: "id-game-1",
          playerId: "id-player-1",
          playerThatHasLeftInBetween: "id-player-2",
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
          error: "The game does not meet the minimum number of players",
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    });
  });

  describe("Scenario: The first turn has correctly started", () => {
    it.effect("Example: Starting a game with 4 players", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.defaultDeck({
          id: "id-deck-1",
          withShuffledCards: [
            "id-card-1",
            "id-card-2",
            "id-card-3",
            "id-card-4",
            "id-card-5",
            "id-card-6",
            "id-card-7",
            "id-card-8",
            "id-card-9",
            "id-card-10",
            "id-card-11",
            "id-card-12",
            "id-card-13",
            "id-card-14",
            "id-card-15",
            "id-card-16",
            "id-card-17",
            "id-card-18",
            "id-card-19",
            "id-card-20",
            "id-card-21",
            "id-card-22",
            "id-card-23",
            "id-card-24",
          ],
        });

        yield* gameDriver.given.existingGame({
          gameId: "id-game-1",
          hostId: "id-player-1",
          players: ["id-player-1", "id-player-2", "id-player-3", "id-player-4"],
        });

        yield* gameDriver.when.startingGame({
          gameId: "id-game-1",
          playerId: "id-player-1",
        });

        yield* gameDriver.assert.currentTurnToEqual({
          gameId: "id-game-1",
          storytellerId: "id-player-1",
          players: ["id-player-1", "id-player-2", "id-player-3", "id-player-4"],
          phase: "storytelling",
          turnNumber: 1,
          turnStartedAt: new Date(),
          turnClue: "",
          playerHands: [
            {
              playerId: "id-player-1",
              cards: [
                "id-card-1",
                "id-card-2",
                "id-card-3",
                "id-card-4",
                "id-card-5",
                "id-card-6",
              ],
            },
            {
              playerId: "id-player-2",
              cards: [
                "id-card-7",
                "id-card-8",
                "id-card-9",
                "id-card-10",
                "id-card-11",
                "id-card-12",
              ],
            },
            {
              playerId: "id-player-3",
              cards: [
                "id-card-13",
                "id-card-14",
                "id-card-15",
                "id-card-16",
                "id-card-17",
                "id-card-18",
              ],
            },
            {
              playerId: "id-player-4",
              cards: [
                "id-card-19",
                "id-card-20",
                "id-card-21",
                "id-card-22",
                "id-card-23",
                "id-card-24",
              ],
            },
          ],
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    });
  });
});
