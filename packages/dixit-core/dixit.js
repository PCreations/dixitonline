const uuid = require('uuid/v1');

const createDixit = ({ player = {}, gamesObservable$, saveGame }) => {
  const _games = {};
  const games = {
    WAITING_FOR_PLAYERS_PHASE: 'WAITING_FOR_PLAYERS_PHASE',
    async create() {
      const game = {
        id: uuid(),
        playersIds: [player.id],
        phase: games.WAITING_FOR_PLAYERS_PHASE,
      };
      await saveGame(game);
      return game;
    },
    get(id) {
      return _games[id];
    },
    getAll() {
      return _games;
    },
    joinGameById(gameId) {
      _games[gameId].playersIds.push(player.id);
      return saveGame(_games[gameId]);
    },
  };
  gamesObservable$.subscribe(game => {
    _games[game.id] = game;
  });

  return {
    games,
  };
};

module.exports = createDixit;
