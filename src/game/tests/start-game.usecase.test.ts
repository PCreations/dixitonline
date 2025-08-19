import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { GameDriver, GameDriverUnitTestLayer } from "./game.driver.js";

describe("Feature: Starting a game", () => {
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
    }).pipe(Effect.provide(GameDriverUnitTestLayer));
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
    }).pipe(Effect.provide(GameDriverUnitTestLayer));
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
    }).pipe(Effect.provide(GameDriverUnitTestLayer));
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
    }).pipe(Effect.provide(GameDriverUnitTestLayer));
  });
});
