import { makePlayer } from '../domain/player';
import { GameStatus, restartGame, startGame } from '../domain/game';

export const makeStartGame = ({ gameRepository, currentUser }) => async ({ gameId }) => {
  const playerTryingToStartGame = makePlayer({ id: currentUser.id, name: currentUser.username });
  const game = await gameRepository.getGameById(gameId);
  const result =
    game.status === GameStatus.ENDED
      ? restartGame(game, playerTryingToStartGame)
      : startGame(game, playerTryingToStartGame);
  if (!result.error) {
    await gameRepository.saveGame(result.value);
  }
  return result;
};
