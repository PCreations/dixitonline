import { updateScore } from '../domain/game';

export const makeUpdateScore = ({ gameRepository }) => async ({ gameId, turnScore }) => {
  const game = await gameRepository.getGameById(gameId);
  const result = updateScore(game, turnScore);
  console.log('UPDATE SCORE RESULT', result);
  if (!result.error) await gameRepository.saveGame(result.value);
  return result;
};
