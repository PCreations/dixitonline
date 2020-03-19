export const newGameCreatedEvent = ({ gameId }) => ({
  type: '[lobby] - a new game has been created',
  payload: {
    gameId,
  },
});
