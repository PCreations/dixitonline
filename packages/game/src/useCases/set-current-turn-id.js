import { setCurrentTurnId } from '../domain/game';

export const makeSetCurrentTurnId = ({ gameRepository }) => async ({ gameId, turnId }) => {
  const game = await gameRepository.getGameById(gameId);
  const result = setCurrentTurnId(game, turnId);
  if (!result.error) await gameRepository.saveGame(result.value);
  return result;
};
