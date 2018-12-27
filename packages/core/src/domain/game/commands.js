const commands = {
  types: {
    CREATE_GAME: '[command][game] - create a game',
    ADD_PLAYER_IN_GAME: '[command][game] - add a player in game',
    START_GAME: '[command][game] - start a game',
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.hostPlayerId - the id of the player that wants to create a new game
   */
  createGame(payload) {
    return {
      type: commands.types.CREATE_GAME,
      payload,
    };
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game in which to add the player
   * @param {string} payload.playerId - the id of the player wanting to join the game
   */
  addPlayerInGame(payload) {
    return {
      type: commands.types.ADD_PLAYER_IN_GAME,
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
