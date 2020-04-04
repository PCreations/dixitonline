export const types = {
  NEW_GAME_CREATED: '[lobby] - a new game has been created',
  PLAYER_JOINED: '[lobby] - a new player has joined a game',
  GAME_STARTED: '[lobby] - a new game has started',
  HANDS_COMPLETED: '[game] - the hands has been completed',
  GAME_ENDED: '[game] - a game has ended',
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

export const handsCompletedEvent = ({ gameId, handsByPlayerId }) => ({
  type: types.HANDS_COMPLETED,
  payload: {
    gameId,
    handsByPlayerId,
  },
});

export const gameEndedEvent = ({ gameId }) => ({
  type: types.GAME_ENDED,
  payload: {
    gameId,
  },
});
