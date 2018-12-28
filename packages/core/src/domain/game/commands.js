const { Command } = require('../command');

const commands = {
  types: {
    CREATE_GAME: '[command][game] - create a game',
    JOIN_GAME: '[command][game] - join a game',
    QUIT_GAME: '[command][game] - quit a game',
    START_GAME: '[command][game] - start a game',
  },
  createGame() {
    return Command({
      type: commands.types.CREATE_GAME,
      payload: {},
    });
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game in which to add the player
   */
  joinGame(payload) {
    return Command({
      type: commands.types.JOIN_GAME,
      payload,
    });
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game the player wants to quit
   */
  quitGame(payload) {
    return Command({
      type: commands.types.QUIT_GAME,
      payload,
    });
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game to start
   */
  startGame(payload) {
    return Command({
      type: commands.types.START_GAME,
      payload,
    });
  },
};

module.exports = {
  commands,
};
