import { setCurrentTurn } from '../domain/game';

export const makeSetCurrentTurn = ({ gameRepository }) => async ({ gameId, turnId, storytellerId }) => {
  const game = await gameRepository.getGameById(gameId);
  const result = setCurrentTurn(game, { id: turnId, storytellerId });
  if (!result.error) await gameRepository.saveGame(result.value);
  return result;
};
