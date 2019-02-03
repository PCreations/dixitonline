const { getDixitCore } = require('../testUtils');
const { shuffledDeck, playersOrder } = require('../fixtures');
const { events: gameEvents } = require('../../domain/game/events');
const { events: turnEvents } = require('../../domain/turn/events');
const { commands: gameCommands } = require('../../domain/game/commands');

/**
 * Feature: starting a new turn
 *
 * As the system
 * I want to start a new turn
 * So the players can play another turn
 */

describe('Scenario: starting the first game turn', () => {
  describe('given a game not yet started', () => {
    describe('when the game is started', () => {
      test('then a new turn should be created and the storyteller phase started', async done => {
        expect.assertions(6);
        const { viewStore, sendCommand, consumeEvents } = getDixitCore({
          history: [
            gameEvents.gameCreated({ gameId: 'game42' }),
            gameEvents.playerHasJoinedAgame({
              gameId: 'game42',
              playerId: 'player42',
              playerName: 'player 42',
            }),
            gameEvents.playerHasJoinedAgame({
              gameId: 'game42',
              playerId: 'player43',
              playerName: 'player 43',
            }),
            gameEvents.playerHasJoinedAgame({
              gameId: 'game42',
              playerId: 'player44',
              playerName: 'player 44',
            }),
            gameEvents.playerHasJoinedAgame({
              gameId: 'game42',
              playerId: 'player45',
              playerName: 'player 45',
            }),
            gameEvents.playersOrderDefined({
              gameId: 'game42',
              players: playersOrder,
            }),
            gameEvents.deckShuffled({
              gameId: 'game42',
              shuffledDeck,
            }),
          ],
          getAuthUser: () => ({
            id: 'player42',
            name: 'player 42',
          }),
        });
        expect(await viewStore.getGameInfo('game42')).toMatchSnapshot('game42 should not be started');
        await viewStore.getGamePlayerHand({ gameId: 'game42', playerId: 'player42' });
        await viewStore.getGamePlayerHand({ gameId: 'game42', playerId: 'player43' });
        await viewStore.getGamePlayerHand({ gameId: 'game42', playerId: 'player44' });
        await viewStore.getGamePlayerHand({ gameId: 'game42', playerId: 'player45' });
        consumeEvents(async event => {
          if (event.type === turnEvents.types.STORYTELLER_PHASE_STARTED) {
            expect(await viewStore.getGamePlayersList('game42')).toMatchSnapshot(
              'should contain the players with the player43 selected as the storyteller',
            );
            expect(
              await viewStore.getGamePlayerHand({ gameId: 'game42', playerId: 'player43' }),
            ).toMatchSnapshot("player43's hand should contain cards 39, 76, 69, 32, 16 and 41");
            expect(
              await viewStore.getGamePlayerHand({ gameId: 'game42', playerId: 'player45' }),
            ).toMatchSnapshot("player45's hand should contain cards 55, 15, 79, 25, 52 and 11");
            expect(
              await viewStore.getGamePlayerHand({ gameId: 'game42', playerId: 'player44' }),
            ).toMatchSnapshot("player44's hand should contain cards 51, 57, 82, 38, 47 and 72");
            expect(
              await viewStore.getGamePlayerHand({ gameId: 'game42', playerId: 'player42' }),
            ).toMatchSnapshot("player42's hand should contain cards 18, 66, 78, 3, 17 and 70");
            done();
          }
        });
        sendCommand(gameCommands.startGame({ gameId: 'game42' }));
      });
    });
  });
});
