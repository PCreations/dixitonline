const { getDixitCore } = require('../testUtils');
const { events: gameEvents } = require('../../domain/game/events');
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
      test.skip('then a new turn should be created and the storyteller phase started', () => {
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
          ],
          getAuthUser: () => ({
            id: 'player42',
            name: 'player 42',
          }),
        });
      });
    });
  });
});
