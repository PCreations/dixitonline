import { makePlayer } from '../domain/player';
import { startGame } from '../domain/game';

export const makeStartGame = ({ lobbyRepository, currentUser }) => async ({ gameId }) => {
  const playerTryingToStartGame = makePlayer({ id: currentUser.id, name: currentUser.username });
  const game = await lobbyRepository.getGameById(gameId);
  const result = startGame(game, playerTryingToStartGame);
  if (!result.error) {
    await lobbyRepository.deleteGameById(gameId);
  }
  return result;
};
