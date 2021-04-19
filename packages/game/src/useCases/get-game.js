export const makeGetGame = ({ gameRepository, getNowDate }) => async (gameId, currentUser) => {
  const game = await gameRepository.getGameById(gameId);
  await gameRepository.savePlayerHeartbeat({ playerId: currentUser.id, gameId, heartbeat: getNowDate() });

  return game;
};
