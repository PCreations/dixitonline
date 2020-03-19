import { makeGame } from '../domain/game';
import { newGameCreatedEvent } from '../domain/events';

export const makeCreateNewGame = ({ lobbyRepository }) => async () => {
  const gameId = lobbyRepository.getNextGameId();

  const game = makeGame({ id: gameId });
  const domainEvents = [newGameCreatedEvent({ gameId })];

  await lobbyRepository.createGame(game);

  return [game, domainEvents];
};
