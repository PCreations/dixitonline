import { makePlayer } from '../domain/player';
import { startGame } from '../domain/game';

export const makeStartGame = ({ gameRepository, currentUser }) => async ({ gameId }) => {
  const playerTryingToStartGame = makePlayer({ id: currentUser.id, name: currentUser.username });
  const game = await gameRepository.getGameById(gameId);
  const result = startGame(game, playerTryingToStartGame);
  if (!result.error) {
    await gameRepository.deleteGameById(gameId);
  }
  return result;
};
