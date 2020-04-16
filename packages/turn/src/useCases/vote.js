import { vote } from '../domain/behaviors';

export const makeVote = ({ turnRepository }) => async ({ playerId, turnId, cardId }) =>
  turnRepository.inTransaction(async ({ getTurnById, saveTurn }) => {
    const turnState = await getTurnById(turnId);
    const result = vote(turnState, { playerId, cardId });
    if (!result.error) {
      await saveTurn(turnId, result.events);
    }
    return result;
  });
