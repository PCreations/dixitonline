const { EventEmitter } = require('events');
const { DixitCore } = require('../index');
const { LobbyQuery } = require('../queries/lobbyQuery');
const { getGameOfId } = require('../domain/game/getGameOfId');
const {
  events: { types: gameEventTypes },
} = require('../domain/game/events');
const { commands: gameCommands } = require('../domain/game/commands');

describe('Feature: creating a game', () => {
  describe('given the authenticated user being user42', () => {
    describe('and the lobby being empty', () => {
      describe('when user42 creates a new game', () => {
        test("then the lobby should contain the created game with user42 in player's list", async done => {
          expect.assertions(3);
          const eventEmitter = new EventEmitter();
          const sendCommand = command => eventEmitter.emit('command', command);
          const dispatchEvents = events => events.map(event => eventEmitter.emit('event', event));
          const consumeCommands = onCommand => eventEmitter.addListener('command', onCommand);
          const consumeEvents = onEvent => eventEmitter.addListener('event', onEvent);
          const getNextGameId = () => 'game42';
          let inMemoryEventStore = {
            games: {},
          };
          const inMemoryViewStore = {
            lobby: undefined,
          };
          const saveEvents = async events => {
            inMemoryEventStore = events.reduce((eventStore, event) => {
              switch (event.meta.aggregateName) {
                case 'game':
                  return {
                    ...eventStore,
                    games: {
                      ...eventStore.games,
                      [event.meta.aggregateId]: (eventStore.games[event.meta.aggregateId] || []).concat([
                        event,
                      ]),
                    },
                  };
                default:
                  return eventStore;
              }
            }, inMemoryEventStore);
          };
          const run = DixitCore({
            getAuthUser: () => ({
              id: '42',
              name: 'player42',
            }),
            consumeCommands,
            dispatchEvents,
            saveEvents,
            getGameOfId: getGameOfId(id => inMemoryEventStore.games[id]),
            getNextGameId,
          });
          const getLobby = LobbyQuery({
            consumeEvents,
            async getLobby() {
              return inMemoryViewStore.lobby;
            },
          });
          run();
          expect(await getLobby()).toMatchSnapshot('lobby should be empty');
          consumeEvents(async event => {
            if (event.type === gameEventTypes.GAME_CREATED) {
              expect(await getLobby()).toMatchSnapshot('lobby should only contains the new empty game');
            }
            if (event.type === gameEventTypes.PLAYER_HAS_JOINED_A_GAME) {
              expect(await getLobby()).toMatchSnapshot(
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