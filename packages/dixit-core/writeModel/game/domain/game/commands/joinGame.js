const { withParams } = require('dixit-utils');

const type = '[game] a player wants to join a game';

const JoinGame = withParams(['gameId', 'playerId'], ({ gameId, playerId }) => ({
  type,
  payload: {
    gameId,
    playerId,
  },
}));

module.exports = {
  type,
  JoinGame,
};
