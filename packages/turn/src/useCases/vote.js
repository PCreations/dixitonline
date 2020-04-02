import { vote } from '../domain/behaviors';

export const makeVote = ({ turnRepository }) => async ({ playerId, turnId, cardId }) => {
  const turnState = await turnRepository.getTurnById(turnId);
  const result = vote(turnState, { playerId, cardId });
  if (!result.error) {
    await turnRepository.saveTurn(turnId, result.events);
  }
  return result;
};
