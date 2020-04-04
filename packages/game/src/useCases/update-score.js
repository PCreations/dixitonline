import { updateScore } from '../domain/game';

export const makeUpdateScore = ({ gameRepository }) => async ({ gameId, turnScore }) => {
  const game = await gameRepository.getGameById(gameId);
  const result = updateScore(game, turnScore);
  if (!result.error) await gameRepository.saveGame(result.value);
  return result;
};
