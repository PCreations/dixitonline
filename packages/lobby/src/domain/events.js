export const newGameCreatedEvent = ({ gameId }) => ({
  type: '[lobby] - a new game has been created',
  payload: {
    gameId,
  },
});

export const playerJoinedGame = ({ gameId, playerId }) => ({
  type: '[lobby] - a new player has joined a game',
  payload: {
    gameId,
    playerId,
  },
});

export const newGameStartedEvent = ({ gameId, playerIds }) => ({
  type: '[lobby] - a new game has started',
  payload: {
    gameId,
    playerIds,
  },
});
