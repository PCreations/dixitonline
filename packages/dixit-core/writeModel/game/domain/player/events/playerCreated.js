const { withParams } = require('dixit-utils');
const { Event } = require('../../event');

const type = '[player] A new player has been created';

const PlayerCreated = withParams(['playerId', 'username'], ({ playerId, username }) =>
  Event({
    type,
    payload: {
      playerId,
      username,
    },
    aggregateName: 'player',
    aggregateId: playerId,
  }),
);

module.exports = {
  type,
  PlayerCreated,
};
