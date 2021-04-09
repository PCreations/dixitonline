import { removeInactivePlayers } from '../domain/game';

export const makeRemoveInactivePlayers = ({ gameRepository }) => async ({ gameId, now }) => {
  const game = await gameRepository.getGameById(gameId);
  const playersHeartbeats = await gameRepository.getGamePlayersHeartbeats(game.id);

  const result = removeInactivePlayers(game, now, playersHeartbeats);

  if (!result.error) {
    await gameRepository.saveGame(result.value);
    await gameRepository.deleteInactivePlayersHeartbeat({ gameId, now });
  }

  return result;
};
