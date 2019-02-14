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

const reduceToLobby = (lobby = Lobby(), event) => {
  switch (event.type) {
    case gameEventTypes.GAME_CREATED:
      return lobby.setIn(['games', event.payload.gameId], Game({ id: event.payload.gameId }));
    case gameEventTypes.PLAYER_HAS_JOINED_A_GAME:
      return lobby.updateIn(['games', event.payload.gameId], game =>
        game.update('players', players =>
          players.add(
            Player({
              id: event.payload.playerId,
              name: event.payload.playerName,
            }),
          ),
        ),
      );
    case gameEventTypes.GAME_STARTED:
      return lobby.removeIn(['games', event.payload.gameId]);
    default:
      return lobby;
  }
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
    handledEventTypes: [gameEventTypes.GAME_CREATED, gameEventTypes.PLAYER_HAS_JOINED_A_GAME],
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
