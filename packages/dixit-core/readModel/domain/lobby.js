const { Record, Map } = require('immutable');

const Lobby = Record({
  games: Map(),
});

const createLobby = lobbyData => new Lobby(lobbyData);

const addGameToLobby = (lobby, { gameId, playerId, username }) =>
  lobby.update('games', games => {
    return games.set(
      gameId,
      Map({
        id: gameId,
        players: [
          {
            id: playerId,
            username,
          },
        ],
      }),
    );
  });

const addPlayerInGame = (lobby, { gameId, playerId, username }) =>
  lobby.updateIn(['games', gameId, 'players'], players =>
    players.concat({
      id: playerId,
      username,
    }),
  );

const toJS = lobby => lobby.toJS();

module.exports = {
  createLobby,
  addGameToLobby,
  addPlayerInGame,
  toJS,
};
