const invariant = require('invariant');
const { Record, Map, is } = require('immutable');
const { share, scan, map, mergeMap, take, tap, distinctUntilChanged } = require('rxjs/operators');
const { from, fromEvent } = require('rxjs');
const { EventEmitter } = require('events');
const { withParams } = require('../../utils/withParams');
const { InMemoryEventStore } = require('../infrastructure/inMemory/eventStore');
const { InMemoryProjectionStore } = require('../infrastructure/inMemory/projectionStore');

const Repository = withParams(
  ['aggregateReducer', 'aggregateName'],
  ({ aggregateReducer, aggregateName }) => ({
    eventStore: { getEventsForAggregate, saveEventsForAggregate },
    dispatchEvents,
  }) => {
    return {
      async get(id) {
        const events = await getEventsForAggregate({ name: aggregateName, id });
        invariant(events.length > 0, `${aggregateName} with id "${id}" not found`);
        dispatchEvents(events);
        return events.reduce(aggregateReducer, { id });
      },
      async save({ id, events }) {
        invariant(typeof id !== 'undefined', `undefined id when trying to save ${aggregateName} aggregate`);
        invariant(Array.isArray(events), `events to be saved must be an array, received instead : ${events}`);
        try {
          await saveEventsForAggregate({ name: aggregateName, id, events });
          dispatchEvents(events);
        } catch (e) {
          console.error(e);
          throw new Error(`${aggregateName} can't be saved`, e);
        }
      },
    };
  },
);

const gameReducer = ({ id, playersIds = [] }, event) => {
  let gameState = { id, playersIds };
  switch (event.type) {
    case '[game] A new game has been created':
      gameState = {
        ...gameState,
        playersIds: [event.payload.playerId],
      };
      break;
    case '[game] A player has joined a game':
      gameState = {
        ...gameState,
        playersIds: [...gameState.playersIds, event.payload.playerId],
      };
      break;
  }
  return Game(gameState);
};

const playerReducer = ({ id, username }, event) => {
  let playerState = { id, username };
  switch (event.type) {
    case '[player] A new player has been created':
      playerState = {
        id,
        username: event.payload.username,
      };
      break;
  }
  return playerState;
};

const GameRepository = Repository({
  aggregateReducer: gameReducer,
  aggregateName: 'game',
});

const PlayerRepository = Repository({
  aggregateReducer: playerReducer,
  aggregateName: 'player',
});

const GameCreated = withParams(
  ['gameId', 'playerId', 'username', 'deck'],
  ({ gameId, playerId, username, deck }) => ({
    type: '[game] A new game has been created',
    payload: {
      gameId,
      playerId,
      username,
      deck,
    },
    meta: {
      timestamp: +new Date(),
      aggregateName: 'game',
      aggregateId: gameId,
    },
  }),
);

const PlayerCreated = withParams(['playerId', 'username'], ({ playerId, username }) => ({
  type: '[player] A new player has been created',
  payload: {
    playerId,
    username,
  },
  meta: {
    timestamp: +new Date(),
    aggregateName: 'player',
    aggregateId: playerId,
  },
}));

const JoinGame = withParams(['gameId', 'playerId'], ({ gameId, playerId }) => ({
  type: '[game] a player wants to join a game',
  payload: {
    gameId,
    playerId,
  },
}));

const PlayerJoinedGame = withParams(['gameId', 'playerId', 'username'], ({ gameId, playerId, username }) => ({
  type: '[game] A player has joined a game',
  payload: {
    gameId,
    playerId,
    username,
  },
  meta: {
    timestamp: +new Date(),
    aggregateName: 'game',
    aggregateId: gameId,
  },
}));

/** Game namespace */

const PlayersList = withParams(['gameId', 'playersIds'], ({ gameId, playersIds }) => {
  return {
    add: withParams(['player'], ({ player }) => {
      invariant(!playersIds.includes(player.id), 'Player already joined this game');
      return [PlayerJoinedGame({ gameId, playerId: player.id, username: player.username })];
    }),
  };
});

const Game = withParams(['id', 'playersIds'], ({ id, playersIds }) => {
  const playersList = PlayersList({ gameId: id, playersIds });
  return Object.freeze({
    addPlayer({ player }) {
      return playersList.add({ player });
    },
  });
});

/** end Game namespace */

const GameUseCases = withParams(
  ['gameRepository', 'playerRepository'],
  ({ gameRepository, playerRepository }) => ({
    joinGame: withParams(['gameId', 'playerId'], async ({ gameId, playerId }) => {
      const game = await gameRepository.get(gameId);
      const player = await playerRepository.get(playerId);
      const events = game.addPlayer({ player });
      gameRepository.save({ id: gameId, events });
    }),
  }),
);

const DixitCore = {
  async WriteModel({ eventStore, dispatchEvents }) {
    const gameRepository = GameRepository({ eventStore, dispatchEvents });
    const playerRepository = PlayerRepository({ eventStore, dispatchEvents });
    const gameUseCases = GameUseCases({ gameRepository, playerRepository });
    return {
      gameUseCases,
    };
  },
  async ReadModel({ events$, projectionStore }) {
    const Lobby = Record({
      games: Map(),
    });
    const lobbyReducer = (lobby, event) => {
      let newLobby = new Lobby(lobby);
      switch (event.type) {
        case '[game] A new game has been created':
          newLobby = newLobby.update('games', games => {
            return games.set(
              event.payload.gameId,
              Map({
                id: event.payload.gameId,
                players: [
                  {
                    id: event.payload.playerId,
                    username: event.payload.username,
                  },
                ],
              }),
            );
          });
          break;
        case '[game] A player has joined a game':
          newLobby = newLobby.updateIn(['games', event.payload.gameId, 'players'], players =>
            players.concat({
              id: event.payload.playerId,
              username: event.payload.username,
            }),
          );
          break;
      }
      return newLobby;
    };

    events$
      .pipe(
        scan(lobbyReducer, new Lobby()),
        distinctUntilChanged(is),
        map(lobby => lobby.toJS()),
        tap(lobby => {
          debugger;
        }),
        map(lobby => ({
          gamesList: Object.values(lobby.games),
        })),
      )
      .subscribe({
        next: projectionStore.lobby.save,
      });
  },
  Client: withParams(['projectionStore', 'dispatchCommand'], ({ projectionStore, dispatchCommand }) => ({
    commands: {
      joinGame: withParams(['gameId', 'playerId'], async ({ gameId, playerId }) => {
        await dispatchCommand(JoinGame({ gameId, playerId }));
      }),
    },
    projections: {
      lobby$: projectionStore.lobby.$,
    },
  })),
};

const testDeck = Array(84)
  .fill({})
  .map((_, i) => ({ id: i, img: `card${i}.png` }));

const createTestCommandDispatcher = withParams(['writeModel'], ({ writeModel }) => async command => {
  const handlers = {
    ['[game] a player wants to join a game']: writeModel.gameUseCases.joinGame,
  };
  await handlers[command.type](command.payload);
});

describe('Given two games in the lobby waiting for players', () => {
  describe('And one of this game was created by Julien and Julie being the unique player', () => {
    describe('When Mathilde joins the game created by Julien', () => {
      test('Then the game created by Julien should now have 2 players', async done => {
        const history = [
          PlayerCreated({ playerId: 'mathilde', username: 'Mathilde' }),
          PlayerCreated({ playerId: 'julien', username: 'Julien' }),
          GameCreated({ gameId: 'g1', playerId: 'mathilde', username: 'Mathilde', deck: testDeck }),
          GameCreated({ gameId: 'g2', playerId: 'julien', username: 'Julien', deck: testDeck }),
        ];
        const eventsEmitter = new EventEmitter();
        const dispatchEvents = events => eventsEmitter.emit('events', events);
        const events$ = fromEvent(eventsEmitter, 'events').pipe(
          mergeMap(events => from(events)),
          share(),
        );
        const inMemoryEventStore = InMemoryEventStore({ history, dispatchEvents });
        const inMemoryProjectionStore = InMemoryProjectionStore();
        const [writeModel, _] = await Promise.all([
          DixitCore.WriteModel({
            eventStore: inMemoryEventStore,
            dispatchEvents,
          }),
          DixitCore.ReadModel({
            events$,
            projectionStore: inMemoryProjectionStore,
          }),
        ]);
        inMemoryEventStore.replayHistory();
        const dixit = await DixitCore.Client({
          dispatchCommand: createTestCommandDispatcher({ writeModel }),
          projectionStore: inMemoryProjectionStore,
        });
        dixit.projections.lobby$
          .pipe(
            take(2),
            map((lobby, i) => {
              debugger;
              if (i === 0) {
                expect(lobby.gamesList).toEqual([
                  {
                    id: 'g1',
                    players: [
                      {
                        id: 'mathilde',
                        username: 'Mathilde',
                      },
                    ],
                  },
                  {
                    id: 'g2',
                    players: [
                      {
                        id: 'julien',
                        username: 'Julien',
                      },
                    ],
                  },
                ]);
              } else {
                expect(lobby.gamesList).toEqual([
                  {
                    id: 'g1',
                    players: [
                      {
                        id: 'mathilde',
                        username: 'Mathilde',
                      },
                    ],
                  },
                  {
                    id: 'g2',
                    players: [
                      {
                        id: 'julien',
                        username: 'Julien',
                      },
                      {
                        id: 'mathilde',
                        username: 'Mathilde',
                      },
                    ],
                  },
                ]);
              }
            }),
          )
          .subscribe({
            complete: done,
            error: done.fail.bind(done),
          });

        await dixit.commands.joinGame({ gameId: 'g2', playerId: 'mathilde' });
      });
    });
  });
});
