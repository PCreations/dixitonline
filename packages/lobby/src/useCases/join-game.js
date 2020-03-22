import { joinPlayer } from '../domain/game';
import { makePlayer } from '../domain/player';

export const makeJoinGame = ({ lobbyRepository }) => async ({ gameId, currentUser }) => {
  const game = await lobbyRepository.getGameById(gameId);

  const result = joinPlayer(game, makePlayer({ id: currentUser.id, name: currentUser.username }));

  if (!result.error) await lobbyRepository.saveGame(result.value);

  return result;
};
