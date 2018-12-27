const commands = {
  types: {
    CREATE_GAME: '[command][game] - create a game',
    JOIN_GAME: '[command][game] - join a game',
    START_GAME: '[command][game] - start a game',
  },
  createGame() {
    return {
      type: commands.types.CREATE_GAME,
      payload: {},
    };
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game in which to add the player
   */
  joinGame(payload) {
    return {
      type: commands.types.JOIN_GAME,
      payload,
    };
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game to start
   */
  startGame(payload) {
    return {
      type: commands.types.START_GAME,
      payload,
    };
  },
};

module.exports = {
  commands,
};
