const { getPlayerOfId } = require('../../domain/player/getPlayerOfId');

const PlayerStore = (playersMap = {}) => ({
  getPlayerOfId: getPlayerOfId(id => playersMap[id]),
});

module.exports = {
  PlayerStore,
};
