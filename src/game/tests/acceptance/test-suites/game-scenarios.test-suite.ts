import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import { GameViewProjector } from '../../../game-view-projector.js';
import {
  getCardInHandByIndex,
  getCurrentStorytellerId,
  getSelectedCardsByPlayer,
} from '../../game.builder.js';
import { GameDriver, type GameDriverLayer } from '../../game.driver.js';
import { defaultIdFactory, type IdFactory } from './create-game.test-suite.js';

export const gameScenariosTestSuite = (
  makeGameDriverTestLayer: () => GameDriverLayer,
  idFactory: IdFactory = defaultIdFactory
) => {
  const { gameId, playerId, deckId } = idFactory;

  describe('Game Scenarios', () => {
    it.effect('Scenario: A game with 4 players', () => {
      return Effect.gen(function* () {
        let gameDriver = yield* GameDriver;
        gameDriver = gameDriver.withFailFastMode();
        yield* gameDriver.given.existingDeck({
          id: deckId(1),
          cards: [
            'card-1',
            'card-2',
            'card-3',
            'card-4',
            'card-5',
            'card-6',
            'card-7',
            'card-8',
            'card-9',
            'card-10',
            'card-11',
            'card-12',
            'card-13',
            'card-14',
            'card-15',
            'card-16',
            'card-17',
            'card-18',
            'card-19',
            'card-20',
            'card-21',
            'card-22',
            'card-23',
            'card-24',
            'card-25',
            'card-26',
            'card-27',
            'card-28',
            'card-29',
            'card-30',
            'card-31',
            'card-32',
            'card-33',
            'card-34',
            'card-35',
            'card-36',
            'card-37',
            'card-38',
            'card-39',
            'card-40',
            'card-41',
            'card-42',
            'card-43',
            'card-44',
            'card-45',
            'card-46',
            'card-47',
            'card-48',
            'card-49',
            'card-50',
            'card-51',
            'card-52',
            'card-53',
            'card-54',
            'card-55',
            'card-56',
            'card-57',
            'card-58',
            'card-59',
            'card-60',
            'card-61',
            'card-62',
            'card-63',
            'card-64',
            'card-65',
            'card-66',
            'card-67',
            'card-68',
            'card-69',
            'card-70',
            'card-71',
            'card-72',
            'card-73',
            'card-74',
            'card-75',
            'card-76',
            'card-77',
            'card-78',
            'card-79',
            'card-80',
            'card-81',
            'card-82',
            'card-83',
            'card-84',
          ],
        });

        const alice = playerId('alice');
        const bob = playerId('bob');
        const charlie = playerId('charlie');
        const dave = playerId('dave');
        const gameIdValue = gameId(1);
        const deckIdValue = deckId(1);

        yield* gameDriver.when.creatingGame({
          gameId: gameIdValue,
          hostId: alice,
          deckId: deckIdValue,
          endCondition: {
            type: 'LimitOfPoints',
            limit: 7,
          },
        });
        const gameViewProjector = yield* GameViewProjector;
        yield* gameDriver.when.joiningGame({
          gameId: gameIdValue,
          playerId: bob,
        });
        yield* gameDriver.when.joiningGame({
          gameId: gameIdValue,
          playerId: charlie,
        });
        yield* gameDriver.when.joiningGame({
          gameId: gameIdValue,
          playerId: dave,
        });
        yield* gameDriver.when.startingGame({
          gameId: gameIdValue,
          playerId: alice,
        });
        let game = yield* gameDriver.getStartedGameSnapshot(gameIdValue);
        let gameViews = yield* gameViewProjector.project(game);

        yield* gameDriver.when.submittingClue({
          gameId: gameIdValue,
          playerId: getCurrentStorytellerId(game),
          cardId: getCardInHandByIndex(game, {
            playerId: getCurrentStorytellerId(game),
            cardIndex: 0,
          }),
          clue: 'A clue',
        });
        game = yield* gameDriver.getStartedGameSnapshot(gameIdValue);
        gameViews = yield* gameViewProjector.project(game);
        yield* gameDriver.assert.gameViewToEqual({
          gameId: gameIdValue,
          gameView: gameViews,
        });

        yield* gameDriver.when.selectingCard({
          gameId: gameIdValue,
          playerId: bob,
          cardId: getCardInHandByIndex(game, {
            playerId: bob,
            cardIndex: 0,
          }),
        });
        yield* gameDriver.when.selectingCard({
          gameId: gameIdValue,
          playerId: charlie,
          cardId: getCardInHandByIndex(game, {
            playerId: charlie,
            cardIndex: 0,
          }),
        });
        yield* gameDriver.when.selectingCard({
          gameId: gameIdValue,
          playerId: dave,
          cardId: getCardInHandByIndex(game, {
            playerId: dave,
            cardIndex: 0,
          }),
        });
        game = yield* gameDriver.getStartedGameSnapshot(gameIdValue);
        gameViews = yield* gameViewProjector.project(game);
        yield* gameDriver.assert.gameViewToEqual({
          gameId: gameIdValue,
          gameView: gameViews,
        });

        yield* gameDriver.when.votingOnCard({
          gameId: gameIdValue,
          playerId: alice,
          cardId: getSelectedCardsByPlayer(game, {
            playerId: bob,
          })[0].cardId,
        });
        yield* gameDriver.when.votingOnCard({
          gameId: gameIdValue,
          playerId: charlie,
          cardId: getSelectedCardsByPlayer(game, {
            playerId: alice,
          })[0].cardId,
        });
        yield* gameDriver.when.votingOnCard({
          gameId: gameIdValue,
          playerId: dave,
          cardId: getSelectedCardsByPlayer(game, {
            playerId: alice,
          })[0].cardId,
        });
        game = yield* gameDriver.getStartedGameSnapshot(gameIdValue);
        gameViews = yield* gameViewProjector.project(game);
        yield* gameDriver.assert.gameViewToEqual({
          gameId: gameIdValue,
          gameView: gameViews,
        });

        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: gameIdValue,
          playerId: alice,
        });
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: gameIdValue,
          playerId: bob,
        });
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: gameIdValue,
          playerId: charlie,
        });
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: gameIdValue,
          playerId: dave,
        });
        game = yield* gameDriver.getStartedGameSnapshot(gameIdValue);
        gameViews = yield* gameViewProjector.project(game);
        yield* gameDriver.assert.gameViewToEqual({
          gameId: gameIdValue,
          gameView: gameViews,
        });

        yield* gameDriver.when.submittingClue({
          gameId: game.id,
          playerId: getCurrentStorytellerId(game),
          cardId: getCardInHandByIndex(game, {
            playerId: getCurrentStorytellerId(game),
            cardIndex: 0,
          }),
          clue: 'A clue for second turn',
        });
        game = yield* gameDriver.getStartedGameSnapshot(gameIdValue);
        gameViews = yield* gameViewProjector.project(game);
        yield* gameDriver.assert.gameViewToEqual({
          gameId: gameIdValue,
          gameView: gameViews,
        });

        yield* gameDriver.when.selectingCard({
          gameId: game.id,
          playerId: alice,
          cardId: getCardInHandByIndex(game, {
            playerId: alice,
            cardIndex: 0,
          }),
        });
        yield* gameDriver.when.selectingCard({
          gameId: game.id,
          playerId: dave,
          cardId: getCardInHandByIndex(game, {
            playerId: dave,
            cardIndex: 1,
          }),
        });
        yield* gameDriver.when.selectingCard({
          gameId: game.id,
          playerId: charlie,
          cardId: getCardInHandByIndex(game, {
            playerId: charlie,
            cardIndex: 1,
          }),
        });
        game = yield* gameDriver.getStartedGameSnapshot(gameIdValue);
        gameViews = yield* gameViewProjector.project(game);
        yield* gameDriver.assert.gameViewToEqual({
          gameId: gameIdValue,
          gameView: gameViews,
        });

        yield* gameDriver.when.votingOnCard({
          gameId: game.id,
          playerId: alice,
          cardId: getSelectedCardsByPlayer(game, {
            playerId: bob,
          })[0].cardId,
        });
        yield* gameDriver.when.votingOnCard({
          gameId: game.id,
          playerId: dave,
          cardId: getSelectedCardsByPlayer(game, {
            playerId: alice,
          })[0].cardId,
        });
        yield* gameDriver.when.votingOnCard({
          gameId: game.id,
          playerId: charlie,
          cardId: getSelectedCardsByPlayer(game, {
            playerId: alice,
          })[0].cardId,
        });
        game = yield* gameDriver.getStartedGameSnapshot(gameIdValue);
        gameViews = yield* gameViewProjector.project(game);
        yield* gameDriver.assert.gameViewToEqual({
          gameId: gameIdValue,
          gameView: gameViews,
        });

        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: game.id,
          playerId: alice,
        });
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: game.id,
          playerId: bob,
        });
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: game.id,
          playerId: charlie,
        });
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: game.id,
          playerId: dave,
        });

        // After all players are ready for next turn, the game ends
        // (because it reached the limit of points: 7)
        yield* gameDriver.assert.gameToBeEnded({
          gameId: gameIdValue,
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });
  });
};
