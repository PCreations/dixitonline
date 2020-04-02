import { defineClue } from '../domain/behaviors';

export const makeDefineClue = ({ turnRepository }) => async ({ playerId, turnId, text, cardId }) => {
  const turnState = await turnRepository.getTurnById(turnId);
  const result = defineClue(turnState, { playerId, text, cardId });
  if (!result.error) {
    await turnRepository.saveTurn(turnId, result.events);
  }
  return result;
};
