import { joinPlayer } from '../domain/game';
import { makePlayer } from '../domain/player';

export const makeJoinGame = ({ lobbyRepository }) => async ({ gameId, currentUser }) => {
  const game = await lobbyRepository.getGameById(gameId);

  const [editedGame, domainEvents] = joinPlayer(game, makePlayer({ id: currentUser.id, name: currentUser.username }));

  await lobbyRepository.saveGame(editedGame);

  return [editedGame, domainEvents];
};
