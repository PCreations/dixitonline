import { getTurnPhaseAs } from '../domain/turn';

export const makeGetTurnPhase = ({ turnRepository }) => async ({ turnId, playerId }) => {
  const turn = await turnRepository.getTurnById(turnId);
  return getTurnPhaseAs(turn, playerId);
};
