const { getDixitCore } = require('./testUtils');
const { events: gameEvents } = require('../domain/game/events');
const { commands: gameCommands } = require('../domain/game/commands');

process.on('unhandledRejection', reason => console.error(reason));

describe('Feature: joining a game', () => {
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
