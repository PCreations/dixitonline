const { getDixitCore } = require('./testUtils');
const { events: gameEvents } = require('../domain/game/events');
const { commands: gameCommands } = require('../domain/game/commands');

/**
 * Feature : Joining a game
 *
 * As a Player
 * I want to join a game
 * So I can play with other players in this game
 */

describe('Scenario: joining a game when there is not enough players yet', () => {
  describe('given the authenticated user being player42', () => {
    describe('and the lobby containing a game with id game41 with player41 in it', () => {
      describe('when player42 joins the game41', () => {
        test("then the lobby should contain game41 with both players in player's list", async done => {
          expect.assertions(2);
          const { viewStore, sendCommand, consumeEvents } = getDixitCore({
            history: [
              gameEvents.gameCreated({ gameId: 'game41' }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game41',
                playerId: 'player41',
                playerName: 'player 41',
              }),
            ],
            getAuthUser: () => ({
              id: 'player42',
              name: 'player 42',
            }),
          });
          expect(await viewStore.getLobby()).toMatchSnapshot(
            'lobby should contain the game41 with player 41 in it',
          );
          consumeEvents(async event => {
            if (event.type === gameEvents.types.PLAYER_HAS_JOINED_A_GAME) {
              expect(await viewStore.getLobby()).toMatchSnapshot(
                'lobby should contain the game41 with the player "player 41" and "player 42" as players',
              );
              done();
            }
          });
          sendCommand(gameCommands.joinGame({ gameId: 'game41' }));
        });
      });
    });
  });
});

describe('Scenario: joining an already started game', () => {
  describe('given the authenticated user being player42', () => {
    describe('and an already started game41', () => {
      describe('when player42 wants to join game41', () => {
        test('then an error should be raised', done => {
          expect.assertions(1);
          const { sendCommand, consumeErrors } = getDixitCore({
            history: [
              gameEvents.gameCreated({ gameId: 'game41' }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game41',
                playerId: 'player41',
                playerName: 'player 41',
              }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game41',
                playerId: 'player43',
                playerName: 'player 43',
              }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game41',
                playerId: 'player44',
                playerName: 'player 44',
              }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game41',
                playerId: 'player45',
                playerName: 'player 45',
              }),
              gameEvents.gameStarted({ gameId: 'game41' }),
            ],
            getAuthUser: () => ({
              id: 'player42',
              name: 'player 42',
            }),
          });
          const joinGameCommand = gameCommands.joinGame({ gameId: 'game41' });
          consumeErrors(error => {
            if (error.correlationId === joinGameCommand.meta.correlationId) {
              expect(error.error).toMatchInlineSnapshot(
                `[Invariant Violation: [error][game] - the game has already started]`,
              );
              done();
            }
          });
          sendCommand(joinGameCommand);
        });
      });
    });
  });
});

describe('Scenario: joining a game where the max number of players has been reached', () => {
  describe('given the authenticated user being player42', () => {
    describe('and a game41 with already 6 players in it', () => {
      describe('when player42 wants to join game41', () => {
        test('then an error should be raised', done => {
          expect.assertions(1);
          const { sendCommand, consumeErrors } = getDixitCore({
            history: [
              gameEvents.gameCreated({ gameId: 'game41' }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game41',
                playerId: 'player41',
                playerName: 'player 41',
              }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game41',
                playerId: 'player43',
                playerName: 'player 43',
              }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game41',
                playerId: 'player44',
                playerName: 'player 44',
              }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game41',
                playerId: 'player45',
                playerName: 'player 45',
              }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game41',
                playerId: 'player46',
                playerName: 'player 46',
              }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game41',
                playerId: 'player47',
                playerName: 'player 47',
              }),
            ],
            getAuthUser: () => ({
              id: 'player42',
              name: 'player 42',
            }),
          });
          const joinGameCommand = gameCommands.joinGame({ gameId: 'game41' });
          consumeErrors(error => {
            if (error.correlationId === joinGameCommand.meta.correlationId) {
              expect(error.error).toMatchInlineSnapshot(
                `[Invariant Violation: [error][game] - impossible to join a game where the max number of players has been reached]`,
              );
              done();
            }
          });
          sendCommand(joinGameCommand);
        });
      });
    });
  });
});
