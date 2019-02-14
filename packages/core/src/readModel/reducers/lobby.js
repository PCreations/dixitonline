const { Record, Map, Set } = require('immutable');
const {
  events: { types: gameEventTypes },
} = require('../../domain/game/events');

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

const createLobbyReducer = () => reduceToLobby;

module.exports = {
  Lobby,
  createLobbyReducer,
  handledEvents: [gameEventTypes.GAME_CREATED, gameEventTypes.PLAYER_HAS_JOINED_A_GAME],
};
