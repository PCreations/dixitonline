import { makeGame } from '../domain/game';
import { newGameCreatedEvent } from '../domain/events';

export const makeCreateNewGame = ({ lobbyRepository }) => async host => {
  const gameId = lobbyRepository.getNextGameId();

  const game = makeGame({ id: gameId, host });
  const domainEvents = [newGameCreatedEvent({ gameId })];

  await lobbyRepository.createGame(game);

  return [game, domainEvents];
};
