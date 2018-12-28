const errors = {
  GAME_ALREADY_STARTED: '[error][game] - the game has already started',
  IMPOSSIBLE_TO_JOIN_A_FULL_GAME:
    '[error][game] - impossible to join a game where the max number of players has been reached',
  GAME_ALREADY_JOINED: '[error][game] - impossible to join an already joined game',
  IMPOSSIBLE_TO_QUIT_THE_GAME: '[error][game] - impossible to quit the game',
  CANNOT_START_THE_GAME_NOT_ENOUGH_PLAYERS: '[error][game] - cannot start the game due to not enough players',
};

module.exports = {
  errors,
};
