import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { PlayersRandomizeStrategy } from "../game.entity.js";
import { PlayerId } from "../player.entity.js";
import { GameDriver, makeGameDriverUnitTestLayer } from "./game.driver.js";

describe("Feature: Starting a game", () => {
  describe("Scenario: Starting a game with different configurations", () => {
    it.effect(
      "Example: Starting a game when the minimum number of players is reached",
      () => {
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
      },
    );

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

    it.effect(
      "Example: Cannot start a game if the game does not meet the minimum number of players",
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.existingNonStartedGame({
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
      },
    );

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

    it.effect(
      "Example: Optimistic concurrency: A player cannot start a game if a player has left in between at the time of starting, making the game not meet the minimum number of players",
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.existingNonStartedGame({
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
      },
    );
  });

  describe("Scenario: The first turn has correctly started", () => {
    it.effect("Example: Starting a game with 4 players", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingDeck({
          id: "id-deck-1",
          cards: [
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
          shuffleStrategy: "identity",
        });
        yield* gameDriver.given.existingNonStartedGame({
          gameId: "id-game-1",
          deckId: "id-deck-1",
          hostId: "id-player-1",
          players: ["id-player-1", "id-player-2", "id-player-3", "id-player-4"],
        });

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

    it.effect(
      "Example: Starting a game with 3 players : each player receives 7 cards instead of 6",
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.existingDeck({
            id: "id-deck-1",
            cards: [
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
            shuffleStrategy: "identity",
          });
          yield* gameDriver.given.existingNonStartedGame({
            gameId: "id-game-1",
            deckId: "id-deck-1",
            hostId: "id-player-1",
            players: ["id-player-1", "id-player-2", "id-player-3"],
          });

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
                cards: [
                  "id-card-1",
                  "id-card-2",
                  "id-card-3",
                  "id-card-4",
                  "id-card-5",
                  "id-card-6",
                  "id-card-7",
                ],
              },
              {
                playerId: "id-player-2",
                cards: [
                  "id-card-8",
                  "id-card-9",
                  "id-card-10",
                  "id-card-11",
                  "id-card-12",
                  "id-card-13",
                  "id-card-14",
                ],
              },
              {
                playerId: "id-player-3",
                cards: [
                  "id-card-15",
                  "id-card-16",
                  "id-card-17",
                  "id-card-18",
                  "id-card-19",
                  "id-card-20",
                  "id-card-21",
                ],
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

          yield* gameDriver.given.defaultDeck({
            id: "id-deck-1",
          });
          yield* gameDriver.given.existingNonStartedGame({
            gameId: "id-game-1",
            deckId: "id-deck-1",
            hostId: "id-player-1",
            players: [
              "id-player-1",
              "id-player-2",
              "id-player-3",
              "id-player-4",
            ],
          });

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
