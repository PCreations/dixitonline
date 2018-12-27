const { EventEmitter } = require('events');
const { DixitCore } = require('../index');
const { LobbyQuery, reduceToLobby } = require('../queries/lobbyQuery');
const { getGameOfId } = require('../domain/game/getGameOfId');
const { events: gameEvents } = require('../domain/game/events');
const { commands: gameCommands } = require('../domain/game/commands');

process.on('unhandledRejection', reason => console.error(reason));

describe('Feature: joining a game', () => {
  describe('given the authenticated user being player42', () => {
    describe('and the lobby containing a game with id game41 with player41 in it', () => {
      describe('when player42 joins the game41', () => {
        test("then the lobby should contain game41 with both players in player's list", async done => {
          expect.assertions(2);
          const eventEmitter = new EventEmitter();
          const sendCommand = command => eventEmitter.emit('command', command);
          const dispatchEvents = events => events.map(event => eventEmitter.emit('event', event));
          const consumeCommands = onCommand => eventEmitter.addListener('command', onCommand);
          const consumeEvents = onEvent => eventEmitter.addListener('event', onEvent);
          const getNextGameId = () => {};
          let inMemoryEventStore = {
            __all__: [
              gameEvents.gameCreated({ gameId: 'game41' }),
              gameEvents.playerHasJoinedAgame({
                gameId: 'game41',
                playerId: 'player41',
                playerName: 'player 41',
              }),
            ],
            games: {
              game41: [
                gameEvents.gameCreated({ gameId: 'game41' }),
                gameEvents.playerHasJoinedAgame({
                  gameId: 'game41',
                  playerId: 'player41',
                  playerName: 'player 41',
                }),
              ],
            },
          };
          const inMemoryViewStore = {
            lobby: inMemoryEventStore.__all__.reduce(reduceToLobby, undefined).toJS(),
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
              id: 'player42',
              name: 'player 42',
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
          expect(await getLobby()).toMatchSnapshot('lobby should contain the game41 with player 41 in it');
          consumeEvents(async event => {
            if (event.type === gameEvents.types.PLAYER_HAS_JOINED_A_GAME) {
              expect(await getLobby()).toMatchSnapshot(
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
