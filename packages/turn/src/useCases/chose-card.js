import { choseCard } from '../domain/behaviors';

export const makeChoseCard = ({ turnRepository }) => async ({ playerId, turnId, cardId }) =>
  turnRepository.inTransaction(async ({ getTurnById, saveTurn }) => {
    const turnState = await getTurnById(turnId);
    const result = choseCard(turnState, { playerId, cardId });
    if (!result.error) {
      await saveTurn(turnId, result.events);
    }
    return result;
  });
