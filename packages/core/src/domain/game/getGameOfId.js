const invariant = require('invariant');
const { reduceToGame } = require('./state');

const getGameOfId = (getEventsForGameOfId = async () => []) => async gameId => {
  try {
    const gameEvents = await getEventsForGameOfId(gameId);
    invariant(Array.isArray(gameEvents) && gameEvents.length > 0, `can't find game with id ${gameId}`);
    return gameEvents.reduce((game, event) => reduceToGame(event)(game), undefined);
  } catch (e) {
    throw e;
  }
};

module.exports = {
  getGameOfId,
};
