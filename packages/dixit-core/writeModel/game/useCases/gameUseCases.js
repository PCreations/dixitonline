const { withParams } = require('dixit-utils');

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

module.exports = {
  GameUseCases,
};
