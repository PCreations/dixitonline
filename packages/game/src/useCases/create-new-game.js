import { createGame, DEFAULT_END_CONDITION } from '../domain/game';

export const makeCreateNewGame = ({ gameRepository }) => async (host, { xTimesStorytellerEndCondition } = {}) => {
  const gameId = gameRepository.getNextGameId();
  const endCondition = DEFAULT_END_CONDITION;
  if (typeof xTimesStorytellerEndCondition !== 'undefined') {
    endCondition.xTimesStorytellerLimit = xTimesStorytellerEndCondition;
  }
  const result = createGame({ gameId, host, endCondition });

  if (!result.error) {
    await gameRepository.saveGame(result.value);
  }

  return result;
};
