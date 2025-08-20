import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { GameDriver, makeGameDriverUnitTestLayer } from "./game.driver.js";

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
