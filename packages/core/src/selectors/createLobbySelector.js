const { Record, Set } = require('immutable');
const { selectNotStartedGame, selectPlayers } = require('../domain/state');

const Player = Record({
  id: undefined,
  name: undefined,
});

const LobbyGame = Record({
  id: undefined,
  players: Set([Player()]),
});

const Lobby = Record({
  games: Set([LobbyGame()]),
});

const createLobbySelector = createSelector =>
  createSelector(
    selectNotStartedGame,
    selectPlayers,
    (notStartedGames, players) =>
      Lobby({
        games: notStartedGames.toSet().map(game =>
          LobbyGame({
            id: game.id,
            players: game.players.map(playerId =>
              Player({
                id: playerId,
                name: players.getIn([playerId, 'name']),
              }),
            ),
          }),
        ),
      }),
  );

module.exports = {
  createLobbySelector,
};
