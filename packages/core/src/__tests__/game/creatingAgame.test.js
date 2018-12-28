const { getDixitCore } = require('../testUtils');
const {
  events: { types: gameEventTypes },
} = require('../../domain/game/events');
const { commands: gameCommands } = require('../../domain/game/commands');

/**
 * Feature : Creating a game
 *
 * As a Player
 * I want to create a new game
 * So other players can join this game
 */
describe('Scenario: creating a game when the lobby is empty', () => {
  describe('given the authenticated user being user42', () => {
    describe('and the lobby being empty', () => {
      describe('when user42 creates a new game', () => {
        test("then the lobby should contain the created game with user42 in player's list", async done => {
          expect.assertions(3);
          const { viewStore, sendCommand, consumeEvents } = getDixitCore({
            getAuthUser: () => ({
              id: '42',
              name: 'player42',
            }),
            getNextGameId: () => 'game42',
          });
          expect(await viewStore.getLobby()).toMatchSnapshot('lobby should be empty');
          consumeEvents(async event => {
            if (event.type === gameEventTypes.GAME_CREATED) {
              expect(await viewStore.getLobby()).toMatchSnapshot(
                'lobby should only contains the new empty game',
              );
            }
            if (event.type === gameEventTypes.PLAYER_HAS_JOINED_A_GAME) {
              expect(await viewStore.getLobby()).toMatchSnapshot(
                'lobby should contain the created game with the player "player42" as the only player',
              );
              done();
            }
          });
          sendCommand(gameCommands.createGame());
        });
      });
    });
  });
});
