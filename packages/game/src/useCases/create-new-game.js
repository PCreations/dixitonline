import { createGame } from '../domain/game';

export const makeCreateNewGame = ({ gameRepository }) => async host => {
  const gameId = gameRepository.getNextGameId();

  const result = createGame({ gameId, host });

  if (!result.error) {
    await gameRepository.saveGame(result.value);
  }

  return result;
};
