const { GameRepository } = require('./game/domain/game/gameRepository');
const { PlayerRepository } = require('./game/domain/player/playerRepository');
const { GameUseCases } = require('./game/useCases/gameUseCases');

const WriteModel = async ({ eventStore, dispatchEvents }) => {
  const gameRepository = GameRepository({ eventStore, dispatchEvents });
  const playerRepository = PlayerRepository({ eventStore, dispatchEvents });
  const gameUseCases = GameUseCases({ gameRepository, playerRepository });
  return {
    gameUseCases,
  };
};

module.exports = {
  WriteModel,
};
