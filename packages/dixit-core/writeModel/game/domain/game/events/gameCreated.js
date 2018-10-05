const { withParams } = require('dixit-utils');
const { Event } = require('../../event');

const type = '[game] A new game has been created';

const GameCreated = withParams(
  ['gameId', 'playerId', 'username', 'deck'],
  ({ gameId, playerId, username, deck }) =>
    Event({
      type,
      payload: {
        gameId,
        playerId,
        username,
        deck,
      },
      aggregateName: 'game',
      aggregateId: gameId,
    }),
);

module.exports = {
  type,
  GameCreated,
};
