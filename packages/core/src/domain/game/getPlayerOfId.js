const { reduceToPlayer } = require('./state');

const getPlayerOfId = (getEventsForPlayerOfId = async () => []) => async gameId =>
  (await getEventsForPlayerOfId(gameId)).reduce(reduceToPlayer, undefined);

module.exports = {
  getPlayerOfId,
};
