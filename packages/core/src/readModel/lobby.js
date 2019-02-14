const { Record, Map, Set } = require('immutable');
const { Projection } = require('./projection');
const {
  events: { types: gameEventTypes },
} = require('../domain/game/events');

const Lobby = Record({
  games: Map(),
});

const Game = Record({
  id: undefined,
  players: Set(),
});

const Player = Record({
  id: undefined,
  name: undefined,
});

const eventHandlers = {
  [gameEventTypes.GAME_CREATED]: (lobby, event) =>
    lobby.setIn(['games', event.payload.gameId], Game({ id: event.payload.gameId })),
  [gameEventTypes.PLAYER_HAS_JOINED_A_GAME]: (lobby, event) =>
    lobby.updateIn(['games', event.payload.gameId], game =>
      game.update('players', players =>
        players.add(
          Player({
            id: event.payload.playerId,
            name: event.payload.playerName,
          }),
        ),
      ),
    ),
  [gameEventTypes.GAME_STARTED]: (lobby, event) => lobby.removeIn(['games', event.payload.gameId]),
};

const handledEventTypes = Object.keys(eventHandlers);

const reduceToLobby = (lobby = Lobby(), event) => {
  if (!handledEventTypes.includes(event.type)) {
    return lobby;
  }
  return eventHandlers[event.type](lobby, event);
};

const fromLobbyDataToImmutableLobby = lobbyData => {
  return typeof lobbyData === 'undefined'
    ? Lobby()
    : Lobby({
        games: Object.keys(lobbyData.games).reduce(
          (games, gameId) =>
            games.set(
              gameId,
              Game({
                id: gameId,
                players: Set((lobbyData.games[gameId].players || []).map(p => Player(p))),
              }),
            ),
          Map(),
        ),
      });
};

const LobbyProjection = ({ getQuery, saveQuery, getEventsFrom, notifyChange }) =>
  Projection({
    handledEventTypes,
    reduceToQueryResult: reduceToLobby,
    fromQueryDataToImmutableData: fromLobbyDataToImmutableLobby,
    getQuery,
    saveQuery,
    getEventsFrom,
    notifyChange,
  });

module.exports = {
  fromLobbyDataToImmutableLobby,
  reduceToLobby,
  LobbyProjection,
};
