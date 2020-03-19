import { makeGame } from './game';
import { newGameCreatedEvent } from './domain-events';

export const makeCreateNewGame = ({ lobbyRepository }) => async () => {
  const gameId = lobbyRepository.getNextGameId();

  const domainEvents = [newGameCreatedEvent({ gameId })];

  return [makeGame({ id: gameId }), domainEvents];
};
