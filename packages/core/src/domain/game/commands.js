const { Command } = require('../command');

const commands = {
  types: {
    CREATE_GAME: '[command][game] - create a game',
    JOIN_GAME: '[command][game] - join a game',
    QUIT_GAME: '[command][game] - quit a game',
    START_GAME: '[command][game] - start a game',
    DEFINE_PLAYERS_ORDER: '[command][game] - define players order',
    SHUFFLE_DECK: '[command][game] - shuffle the deck',
    DEAL_HAND_TO_PLAYER: '[command][game] - deal hand to a player',
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
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game
   * @param {string} payload.playerId - the id of the player
   * @param {[string]} payload.cards - the cards id
   */
  dealHandToPlayer(payload) {
    return Command({
      type: commands.types.DEAL_HAND_TO_PLAYER,
      payload,
    });
  },
};

module.exports = {
  commands,
};
