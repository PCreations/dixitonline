export const types = {
  NEW_GAME_CREATED: '[lobby] - a new game has been created',
  PLAYER_JOINED: '[lobby] - a new player has joined a game',
  GAME_STARTED: '[lobby] - a new game has started',
};

export const newGameCreatedEvent = ({ gameId }) => ({
  type: types.NEW_GAME_CREATED,
  payload: {
    gameId,
  },
});

export const playerJoinedGame = ({ gameId, playerId }) => ({
  type: types.PLAYER_JOINED,
  payload: {
    gameId,
    playerId,
  },
});

export const newGameStartedEvent = ({ gameId, playerIds }) => ({
  type: types.GAME_STARTED,
  payload: {
    gameId,
    playerIds,
  },
});
