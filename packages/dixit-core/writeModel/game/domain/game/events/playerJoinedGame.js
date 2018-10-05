const { withParams } = require('dixit-utils');
const { Event } = require('../../event');

const type = '[game] A player has joined a game';

const PlayerJoinedGame = withParams(['gameId', 'playerId', 'username'], ({ gameId, playerId, username }) =>
  Event({
    type,
    payload: {
      gameId,
      playerId,
      username,
    },
    aggregateName: 'game',
    aggregateId: gameId,
  }),
);

module.exports = {
  type,
  PlayerJoinedGame,
};
