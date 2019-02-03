const { Command } = require('../command');

const commands = {
  types: {
    START_TURN: '[command][turn] - start a new turn',
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game
   * @param {string} payload.turnId - the id of the turn
   */
  startTurn(payload) {
    return Command({
      types: commands.types.START_TURN,
      payload,
    });
  },
};

module.exports = {
  commands,
};
