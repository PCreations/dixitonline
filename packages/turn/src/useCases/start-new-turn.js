import { events } from '../domain/events';

export const makeStartNewTurn = ({ turnRepository }) => async ({ gameId, players, storytellerId }) => {
  const turnId = turnRepository.getNextTurnId();
  return turnRepository.saveTurn(turnId, [events.turnStarted({ id: turnId, gameId, players, storytellerId })]);
};
