import { viewPhaseAs } from '../domain/view-phase-as';

export const makeGetTurnPhase = ({ turnRepository }) => async ({ turnId, playerId }) => {
  const turn = await turnRepository.getTurnById(turnId);
  return viewPhaseAs(turn, playerId);
};
