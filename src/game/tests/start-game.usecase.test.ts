import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { PlayersRandomizeStrategy } from "../game.entity.js";
import { PlayerId } from "../player.entity.js";
import { GameBuilder } from "./game.builder.js";
import { GameDriver, makeGameDriverUnitTestLayer } from "./game.driver.js";

describe("Feature: Starting a game", () => {
  describe("Scenario: Starting a game with different configurations", () => {
    it.effect(
      "Example: Starting a game when the minimum number of players is reached",
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder("id-game-1")
              .hostedBy("id-player-1")
              .withPlayers("id-player-2", "id-player-3"),
          );

          yield* gameDriver.when.startingGame({
            gameId: "id-game-1",
            playerId: "id-player-1",
          });

          yield* gameDriver.assert.gameToHaveBeenStarted({
            gameId: "id-game-1",
          });
        }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
      },
    );

    it.effect("Example: Only the host can start the game", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder("id-game-1")
            .hostedBy("id-player-1")
            .withPlayers("id-player-2", "id-player-3"),
        );

        yield* gameDriver.when.startingGame({
          gameId: "id-game-1",
          playerId: "id-player-2",
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
          error: "Only the host can start the game",
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    });

    it.effect(
      "Example: Cannot start a game if the game does not meet the minimum number of players",
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder("id-game-1")
              .hostedBy("id-player-1")
              .withPlayers("id-player-2"),
          );

          yield* gameDriver.when.startingGame({
            gameId: "id-game-1",
            playerId: "id-player-1",
          });

          yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
            error: "The game does not meet the minimum number of players",
          });
        }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
      },
    );

    it.effect("Example: A player not in game cannot start it", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder("id-game-1")
            .hostedBy("id-player-1")
            .withPlayers("id-player-2", "id-player-3"),
        );

        yield* gameDriver.when.startingGame({
          gameId: "id-game-1",
          playerId: "id-player-not-in-game",
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
          error: "Player not in game",
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    });

    it.effect(
      "Example: Optimistic concurrency: A player cannot start a game if a player has left in between at the time of starting, making the game not meet the minimum number of players",
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder("id-game-1")
              .hostedBy("id-player-1")
              .withPlayers("id-player-2", "id-player-3"),
          );

          yield* gameDriver.when.startingGameWhileAnotherPlayerLeftInBetween({
            gameId: "id-game-1",
            playerId: "id-player-1",
            playerThatHasLeftInBetween: "id-player-2",
          });

          yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
            error: "The game does not meet the minimum number of players",
          });
        }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
      },
    );
  });

  describe("Scenario: The first turn has correctly started", () => {
    it.effect("Example: Starting a game with 4 players", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        const { deck } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder("id-game-1")
            .hostedBy("id-player-1")
            .withPlayers("id-player-2", "id-player-3", "id-player-4")
            .withDeck("id-deck-1"),
        );

        yield* gameDriver.when.startingGame({
          gameId: "id-game-1",
          playerId: "id-player-1",
        });

        yield* gameDriver.assert.currentTurnToBeStarted({
          gameId: "id-game-1",
          storytellerId: "id-player-1",
        });
        yield* gameDriver.assert.playerHandsToEqual({
          gameId: "id-game-1",
          playerHands: [
            {
              playerId: "id-player-1",
              cards: deck.cards.slice(0, 6),
            },
            {
              playerId: "id-player-2",
              cards: deck.cards.slice(6, 12),
            },
            {
              playerId: "id-player-3",
              cards: deck.cards.slice(12, 18),
            },
            {
              playerId: "id-player-4",
              cards: deck.cards.slice(18, 24),
            },
          ],
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    });

    it.effect(
      "Example: Starting a game with 3 players : each player receives 7 cards instead of 6",
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          const { deck } = yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder("id-game-1")
              .hostedBy("id-player-1")
              .withPlayers("id-player-2", "id-player-3")
              .withDeck("id-deck-1"),
          );

          yield* gameDriver.when.startingGame({
            gameId: "id-game-1",
            playerId: "id-player-1",
          });

          yield* gameDriver.assert.currentTurnToBeStarted({
            gameId: "id-game-1",
            storytellerId: "id-player-1",
          });
          yield* gameDriver.assert.playerHandsToEqual({
            gameId: "id-game-1",
            playerHands: [
              {
                playerId: "id-player-1",
                cards: deck.cards.slice(0, 7),
              },
              {
                playerId: "id-player-2",
                cards: deck.cards.slice(7, 14),
              },
              {
                playerId: "id-player-3",
                cards: deck.cards.slice(14, 21),
              },
            ],
          });
        }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
      },
    );

    it.effect(
      "Example: The players orders can be randomized when the game is started",
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder("id-game-1")
              .hostedBy("id-player-1")
              .withPlayers("id-player-2", "id-player-3", "id-player-4")
              .withDeck("id-deck-1"),
          );

          yield* gameDriver.when.startingGame({
            gameId: "id-game-1",
            playerId: "id-player-1",
          });

          yield* gameDriver.assert.gameToHavePlayers({
            gameId: "id-game-1",
            players: [
              "id-player-3",
              "id-player-1",
              "id-player-4",
              "id-player-2",
            ],
          });
        }).pipe(
          Effect.provide(
            makeGameDriverUnitTestLayer({
              randomizeStrategy: PlayersRandomizeStrategy.of({
                type: "fake",
                randomize: () => [
                  PlayerId("id-player-3"),
                  PlayerId("id-player-1"),
                  PlayerId("id-player-4"),
                  PlayerId("id-player-2"),
                ],
              }),
            }),
          ),
        );
      },
    );
  });
});
