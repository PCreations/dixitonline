const { getDixitCore } = require('./testUtils');
const { events: gameEvents } = require('../domain/game/events');
const { commands: gameCommands } = require('../domain/game/commands');

/**
 * Feature : Starting a game
 *
 * As a Player
 * I want to start a game that I host
 * So the game can starts
 */

describe('Scenario: starting a game as the host of the game when the minimum number of player is reached', () => {
  describe('given the authenticated user being player42', () => {
    describe('and the lobby containing a game with id game42 with more than 4 players in it', () => {
      describe('when player42 starts the game42', () => {
        test('then the lobby should not contain game42 anymore', async done => {
          expect.assertions(2);
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
          expect(await viewStore.getLobby()).toMatchSnapshot(
            'lobby should contain the game42 with player 42, player 43, player 44 and player 45 in it',
          );
          consumeEvents(async event => {
            if (event.type === gameEvents.types.GAME_STARTED) {
              expect(await viewStore.getLobby()).toMatchSnapshot(
                'lobby should not contain the game42 anymore',
              );
              done();
            }
          });
          sendCommand(gameCommands.startGame({ gameId: 'game42' }));
        });
      });
    });
  });
});

describe('Scenario: starting a game as the host of the game when the minimum number of player has not been reached', () => {
  describe('given the authenticated user being player42', () => {
    describe('and game42 being already started', () => {
      describe('when player42 starts the game42', () => {
        test('then an error should be raised', done => {
          expect.assertions(1);
          const { sendCommand, consumeErrors } = getDixitCore({
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
              gameEvents.gameStarted({ gameId: 'game42' }),
            ],
            getAuthUser: () => ({
              id: 'player42',
              name: 'player 42',
            }),
          });
          const startGameCommand = gameCommands.startGame({ gameId: 'game42' });
          consumeErrors(error => {
            if (error.correlationId === startGameCommand.meta.correlationId) {
              expect(error.error).toMatchInlineSnapshot(
                `[Invariant Violation: [error][game] - the game has already started]`,
              );
              done();
            }
          });
          sendCommand(startGameCommand);
        });
      });
    });
  });
});

describe('Scenario: starting a game, as the host, that is already started', () => {
  describe('given the authenticated user being player42', () => {
    describe('and the lobby containing a game with id game42 with less than 4 players in it', () => {
      describe('when player42 starts the game42', () => {
        test('then an error should be raised', done => {
          expect.assertions(1);
          const { sendCommand, consumeErrors } = getDixitCore({
            history: [
              gameEvents.gameCreated({ gameId: 'game42' }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game42',
                playerId: 'player42',
                playerName: 'player 42',
              }),
            ],
            getAuthUser: () => ({
              id: 'player42',
              name: 'player 42',
            }),
          });
          const startGameCommand = gameCommands.startGame({ gameId: 'game42' });
          consumeErrors(error => {
            if (error.correlationId === startGameCommand.meta.correlationId) {
              expect(error.error).toMatchInlineSnapshot(
                `[Invariant Violation: [error][game] - cannot start the game due to not enough players]`,
              );
              done();
            }
          });
          sendCommand(startGameCommand);
        });
      });
    });
  });
});
