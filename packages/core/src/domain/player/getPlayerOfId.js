const { Player } = require('./index');

const getPlayerOfId = (getPlayerOfId = async playerId => []) => async playerId =>
  Player(await getPlayerOfId(playerId));

module.exports = {
  getPlayerOfId,
};
