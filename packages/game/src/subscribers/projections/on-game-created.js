export const createOnGameCreated = ({ gameProjectionGateway, gameRepository }) => async ({ gameId }) => {
  const createdGame = await gameRepository.getGameById(gameId);

  const gameProjection = {
    id: gameId,
    status: createdGame.status,
    endCondition: createdGame.endCondition,
    players: {
      [createdGame.host.id]: {
        isHost: true,
        username: createdGame.host.name,
        isReady: true,
        score: 0,
        isStoryteller: false,
      },
    },
  };

  return gameProjectionGateway.save(gameProjection);
};
