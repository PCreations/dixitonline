import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import {
  GameBuilder,
  getCardsInDrawPile,
  getPlayerHand,
} from "./game.builder.js";
import { GameDriver, makeGameDriverUnitTestLayer } from "./game.driver.js";

describe("Feature: Notifying to be ready for the next turn", () => {
  it.effect(
    "Example: A player can notify to be ready for the next turn",
    () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        const now = new Date();

        yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder("id-game-1")
            .hostedBy("id-player-1")
            .withPlayers(
              "id-player-1",
              "id-player-2",
              "id-player-3",
              "id-player-4",
            )
            .withPlayersReadyForNextTurn([])
            .inScoringPhaseSince(now),
        );

        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: "id-game-1",
          playerId: "id-player-1",
        });

        yield* gameDriver.assert.playersReadyForNextTurnToEqual({
          gameId: "id-game-1",
          playersReadyForNextTurn: ["id-player-1"],
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );

  it.effect(
    "Example: A player not in game can't notify to be ready for the next turn",
    () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        const now = new Date();

        yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder("id-game-1")
            .hostedBy("id-player-1")
            .withPlayers(
              "id-player-1",
              "id-player-2",
              "id-player-3",
              "id-player-4",
            )
            .withPlayersReadyForNextTurn([])
            .inScoringPhaseSince(now),
        );

        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: "id-game-1",
          playerId: "id-player-5",
        });

        yield* gameDriver.assert
          .playerToNotHaveBeenAbleToNotifyToBeReadyForNextTurn({
            error: "Player not in game",
          });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );

  it.effect(
    "Example: A player can't notify to be ready for the next turn if the game is not in scoring phase",
    () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder("id-game-1")
            .hostedBy("id-player-1")
            .withPlayers(
              "id-player-1",
              "id-player-2",
              "id-player-3",
              "id-player-4",
            )
            .started()
            .withPlayersReadyForNextTurn([]),
        );

        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: "id-game-1",
          playerId: "id-player-4",
        });

        yield* gameDriver.assert
          .playerToNotHaveBeenAbleToNotifyToBeReadyForNextTurn({
            error: "Game is not in scoring phase",
          });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );

  it.effect(
    "Example: When the last player notifies to be ready for the next turn, the game is updated to the next turn",
    () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        const now = new Date();

        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder("id-game-1")
            .hostedBy("id-player-1")
            .withPlayers(
              "id-player-1",
              "id-player-2",
              "id-player-3",
              "id-player-4",
            )
            .inScoringPhaseSince(now)
            .withPlayersReadyForNextTurn([
              "id-player-1",
              "id-player-2",
              "id-player-3",
            ]),
        );
        const firstPlayerHand = getPlayerHand(game, {
          playerId: "id-player-1",
        });
        const secondPlayerHand = getPlayerHand(game, {
          playerId: "id-player-2",
        });
        const thirdPlayerHand = getPlayerHand(game, {
          playerId: "id-player-3",
        });
        const fourthPlayerHand = getPlayerHand(game, {
          playerId: "id-player-4",
        });
        const drawPile = getCardsInDrawPile(game);

        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: "id-game-1",
          playerId: "id-player-4",
        });

        yield* gameDriver.assert.newTurnToBeStarted({
          gameId: "id-game-1",
          storytellerId: "id-player-2",
          cardsInDrawPile: getCardsInDrawPile(game).slice(4),
          playerHands: [
            {
              playerId: "id-player-1",
              cards: [
                ...(firstPlayerHand.map((card) => card.id)),
                drawPile[0].id,
              ],
            },
            {
              playerId: "id-player-2",
              cards: [
                ...(secondPlayerHand.map((card) => card.id)),
                drawPile[1].id,
              ],
            },
            {
              playerId: "id-player-3",
              cards: [
                ...(thirdPlayerHand.map((card) => card.id)),
                drawPile[2].id,
              ],
            },
            {
              playerId: "id-player-4",
              cards: [
                ...(fourthPlayerHand.map((card) => card.id)),
                drawPile[3].id,
              ],
            },
          ],
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );
});
