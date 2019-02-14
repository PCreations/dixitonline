const { fromLobbyDataToImmutableLobby, LobbyProjection } = require('../lobby');
const { Query } = require('../query');
const { events } = require('../../domain/game/events');

const EventStore = () => {
  const events = [];
  const listeners = [];
  const eventIds = () => events.map(e => e.meta.eventId);
  return {
    dispatch(event) {
      events.push(event);
      listeners.map(listener => listener(event));
    },
    subscribe(listener) {
      listeners.push(listener);
    },
    getEventsFrom(event) {
      const eventIndex = eventIds().indexOf(event.meta.eventId);
      if (eventIndex === -1) {
        throw new Error(`event with id ${eventId} not found in ${eventIds().join(',')}`);
      }
      return events.slice(eventIndex, events.length);
    },
  };
};

describe('given an empty lobby query', () => {
  describe('when subscribing to lobby query', () => {
    test('then the empty lobby query should be returned', done => {
      const lobbyQuery = Query({
        getQuery: () => fromLobbyDataToImmutableLobby().toJS(),
        addOnQueryChangeListener: () => {},
      });
      lobbyQuery.subscribe(lobbyData => {
        expect(lobbyData).toMatchSnapshot('lobby query result should be empty');
        done();
      });
    });
  });
});

describe('given a stored lobby query', () => {
  describe('when subscribing to lobby query', () => {
    test('then stored lobby query should be returned', () => {
      const storedLobbyQuery = {
        games: {
          g1: {
            id: 'g1',
            players: [{ id: 'p1', name: 'player1' }, { id: 'p2', name: 'player2' }],
          },
        },
      };
      const lobbyQuery = Query({
        getQuery: async () => storedLobbyQuery,
        addOnQueryChangeListener: () => {},
      });
      lobbyQuery.subscribe(lobbyData => {
        expect(lobbyData).toMatchSnapshot('lobby query should contain game g1 with players p1 and p2');
      });
    });
    describe('and an new game created event is received', () => {
      test('then the lobby query should contain the created game', async done => {
        const eventStore = EventStore();
        let updates = 0;
        const storedLobbyQuery = fromLobbyDataToImmutableLobby().toJS();
        const listeners = [];
        const lobbyProjection = LobbyProjection({
          getQuery: async () => storedLobbyQuery,
          getEventsFrom: eventStore.getEventsFrom,
          saveQuery: () => {},
          notifyChange: lobbyQueryResult => listeners.map(listener => listener(lobbyQueryResult)),
        });
        eventStore.subscribe(event => lobbyProjection(event));
        const lobbyQuery = Query({
          getQuery: async () => storedLobbyQuery,
          addOnQueryChangeListener: listener => {
            listeners.push(listener);
          },
        });
        await lobbyQuery.subscribe(lobbyData => {
          updates += 1;
          if (updates === 2) {
            expect(lobbyData).toMatchSnapshot('lobby query should contain the newly created game');
            done();
          }
        });
        eventStore.dispatch(events.gameCreated({ gameId: 'g1' }));
      });
      describe('and a new player has joined game event is received', () => {
        test('then the lobby query should contain the created game with the player that joined the game', async done => {
          const eventStore = EventStore();
          let updates = 0;
          const listeners = [];
          const saveQuery = lobbyData => {
            viewStore.lobby = lobbyData;
          };
          const lobbyProjection = LobbyProjection({
            getQuery: async () => viewStore.lobby,
            getEventsFrom: eventStore.getEventsFrom,
            saveQuery,
            notifyChange: lobbyQueryResult => listeners.map(listener => listener(lobbyQueryResult)),
          });
          const viewStore = {
            lobby: fromLobbyDataToImmutableLobby().toJS(),
          };
          eventStore.subscribe(event => lobbyProjection(event));
          const lobbyQuery = Query({
            getQuery: async () => viewStore.lobby,
            addOnQueryChangeListener: listener => {
              listeners.push(listener);
            },
          });
          await lobbyQuery.subscribe(lobbyData => {
            updates += 1;
            if (updates === 3) {
              expect(lobbyData).toMatchSnapshot(
                'lobby query should contain the newly created game with the player that just joined the game',
              );
              done();
            }
          });
          eventStore.dispatch(events.gameCreated({ gameId: 'g1' }));
          setImmediate(() =>
            eventStore.dispatch(
              events.playerHasJoinedAgame({ gameId: 'g1', playerId: 'p1', playerName: 'player1' }),
            ),
          );
        });
      });
    });
  });
});
