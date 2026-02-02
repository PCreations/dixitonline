import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import {
  GameBuilder,
  getCardsInDrawPile,
  getPlayerHand,
} from '../../game.builder.js';
import { GameDriver, type GameDriverLayer } from '../../game.driver.js';
import { defaultIdFactory, type IdFactory } from './create-game.test-suite.js';

export const readyForNextTurnTestSuite = (
  makeGameDriverTestLayer: () => GameDriverLayer,
  idFactory: IdFactory = defaultIdFactory,
) => {
  const { gameId, playerId } = idFactory;

  describe('Feature: Notifying to be ready for the next turn', () => {
    it.effect(
      'Example: A player can notify to be ready for the next turn',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          const now = new Date();

          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
              .withPlayersReadyForNextTurn([])
              .inScoringPhaseSince(now),
          );

          yield* gameDriver.when.notifyingToBeReadyForNextTurn({
            gameId: gameId(1),
            playerId: playerId(1),
          });

          yield* gameDriver.assert.playersReadyForNextTurnToEqual({
            gameId: gameId(1),
            playersReadyForNextTurn: [playerId(1)],
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    it.effect(
      'Example: A player notifying to be ready for the next turn twice should be idempotent (not counted twice)',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          const now = new Date();

          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
              .withPlayersReadyForNextTurn([])
              .inScoringPhaseSince(now),
          );

          // Player 1 notifies twice (simulating double-click or network retry)
          yield* gameDriver.when.notifyingToBeReadyForNextTurn({
            gameId: gameId(1),
            playerId: playerId(1),
          });
          yield* gameDriver.when.notifyingToBeReadyForNextTurn({
            gameId: gameId(1),
            playerId: playerId(1),
          });

          // Player 2 and 3 notify
          yield* gameDriver.when.notifyingToBeReadyForNextTurn({
            gameId: gameId(1),
            playerId: playerId(2),
          });
          yield* gameDriver.when.notifyingToBeReadyForNextTurn({
            gameId: gameId(1),
            playerId: playerId(3),
          });

          // Should NOT have advanced to next turn (only 3 unique players ready)
          yield* gameDriver.assert.playersReadyForNextTurnToEqual({
            gameId: gameId(1),
            playersReadyForNextTurn: [playerId(1), playerId(2), playerId(3)],
          });

          // Game should still be in scoring phase
          yield* gameDriver.assert.turnToBeInScoringPhase({
            gameId: gameId(1),
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
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
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
              .withPlayersReadyForNextTurn([])
              .inScoringPhaseSince(now),
          );

          yield* gameDriver.when.notifyingToBeReadyForNextTurn({
            gameId: gameId(1),
            playerId: playerId(5),
          });

          yield* gameDriver.assert.playerToNotHaveBeenAbleToNotifyToBeReadyForNextTurn(
            {
              error: 'Player not in game',
            },
          );
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    it.effect(
      "Example: A player can't notify to be ready for the next turn if the game is not in scoring phase",
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
              .started()
              .withPlayersReadyForNextTurn([]),
          );

          yield* gameDriver.when.notifyingToBeReadyForNextTurn({
            gameId: gameId(1),
            playerId: playerId(4),
          });

          yield* gameDriver.assert.playerToNotHaveBeenAbleToNotifyToBeReadyForNextTurn(
            {
              error: 'Game is not in scoring phase',
            },
          );
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    it.effect(
      'Example: When the last player notifies to be ready for the next turn, the game is updated to the next turn',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          const now = new Date();

          const { game } = yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
              .inScoringPhaseSince(now)
              .withPlayersReadyForNextTurn([
                playerId(1),
                playerId(2),
                playerId(3),
              ]),
          );
          const firstPlayerHand = getPlayerHand(game, {
            playerId: playerId(1),
          });
          const secondPlayerHand = getPlayerHand(game, {
            playerId: playerId(2),
          });
          const thirdPlayerHand = getPlayerHand(game, {
            playerId: playerId(3),
          });
          const fourthPlayerHand = getPlayerHand(game, {
            playerId: playerId(4),
          });
          const drawPile = getCardsInDrawPile(game);

          yield* gameDriver.when.notifyingToBeReadyForNextTurn({
            gameId: gameId(1),
            playerId: playerId(4),
          });

          yield* gameDriver.assert.newTurnToBeStarted({
            gameId: gameId(1),
            storytellerId: playerId(2),
            cardsInDrawPile: getCardsInDrawPile(game).slice(4),
            playerHands: [
              {
                playerId: playerId(1),
                cards: [
                  ...firstPlayerHand.map((card) => card.id),
                  drawPile[0].id,
                ],
              },
              {
                playerId: playerId(2),
                cards: [
                  ...secondPlayerHand.map((card) => card.id),
                  drawPile[1].id,
                ],
              },
              {
                playerId: playerId(3),
                cards: [
                  ...thirdPlayerHand.map((card) => card.id),
                  drawPile[2].id,
                ],
              },
              {
                playerId: playerId(4),
                cards: [
                  ...fourthPlayerHand.map((card) => card.id),
                  drawPile[3].id,
                ],
              },
            ],
            playersHavingBeenStoryteller: {
              [playerId(1)]: 1,
              [playerId(2)]: 0,
              [playerId(3)]: 0,
              [playerId(4)]: 0,
            },
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    describe('End game conditions', () => {
      it.effect(
        'Example: Number of time storyteller, when the last player notifies to be ready for the next turn and everyone has been storyteller x number of times, the game is ended',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;
            const now = new Date();

            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withEndCondition({
                  type: 'NumberOfTimesBeingStoryteller',
                  numberOfTimes: 2,
                })
                .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
                .withPlayersHavingBeenStorytellerXNumberOfTimes(
                  new Map([
                    [playerId(1), 1], // Player is the storyteller for the last turn, so it will make it to 2
                    [playerId(2), 2],
                    [playerId(3), 2],
                    [playerId(4), 2],
                  ]),
                )
                .inScoringPhaseSince(now)
                .withPlayersReadyForNextTurn([
                  playerId(1),
                  playerId(2),
                  playerId(3),
                ]),
            );

            yield* gameDriver.when.notifyingToBeReadyForNextTurn({
              gameId: gameId(1),
              playerId: playerId(4),
            });

            yield* gameDriver.assert.gameToBeEnded({
              gameId: gameId(1),
            });
          }).pipe(Effect.provide(makeGameDriverTestLayer()));
        },
      );

      it.effect(
        'Example: Number of points, when the last player notifies to be ready for the next turn and a player has reached the point limit, the game is ended',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;
            const now = new Date();

            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withEndCondition({
                  type: 'LimitOfPoints',
                  limit: 10,
                })
                .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
                .withScores([
                  { playerId: playerId(1), score: 10 },
                  { playerId: playerId(2), score: 0 },
                  { playerId: playerId(3), score: 0 },
                  { playerId: playerId(4), score: 0 },
                ])
                .inScoringPhaseSince(now)
                .withPlayersReadyForNextTurn([
                  playerId(1),
                  playerId(2),
                  playerId(3),
                ]),
            );

            yield* gameDriver.when.notifyingToBeReadyForNextTurn({
              gameId: gameId(1),
              playerId: playerId(4),
            });

            yield* gameDriver.assert.gameToBeEnded({
              gameId: gameId(1),
            });
          }).pipe(Effect.provide(makeGameDriverTestLayer()));
        },
      );
    });
  });
};
