import { removeInactivePlayers } from '../domain/game';

export const makeRemoveInactivePlayers = ({ gameRepository }) => async ({ gameId, now }) => {
  const game = await gameRepository.getGameById(gameId);

  const result = removeInactivePlayers(game, now);

  if (!result.error) await gameRepository.saveGame(result.value);

  return result;
};
