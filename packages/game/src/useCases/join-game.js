import { joinPlayer } from '../domain/game';
import { makePlayer } from '../domain/player';

export const makeJoinGame = ({ gameRepository }) => async ({ gameId, currentUser }) => {
  const game = await gameRepository.getGameById(gameId);

  const result = joinPlayer(game, makePlayer({ id: currentUser.id, name: currentUser.username }));

  if (!result.error) await gameRepository.saveGame(result.value);

  return result;
};
