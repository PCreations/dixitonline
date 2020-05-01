import { createGame, DEFAULT_END_CONDITION } from '../domain/game';

export const makeCreateNewGame = ({ gameRepository }) => async (host, endCondition = DEFAULT_END_CONDITION) => {
  const gameId = gameRepository.getNextGameId();
  const result = createGame({ gameId, host, endCondition });

  if (!result.error) {
    await gameRepository.saveGame(result.value);
  }

  return result;
};
