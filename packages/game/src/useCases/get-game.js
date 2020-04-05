export const makeGetGame = ({ gameRepository }) => gameId => gameRepository.getGameById(gameId);
