import { quitPlayer } from '../domain/game';
import { makePlayer } from '../domain/player';

export const makeQuitGame = ({ gameRepository }) => async ({ gameId, currentUser }) => {
  const game = await gameRepository.getGameById(gameId);

  const result = quitPlayer(game, makePlayer({ id: currentUser.id, name: currentUser.username }));

  if (!result.error) await gameRepository.saveGame(result.value);

  return result;
};
