import { viewPhaseAs } from '../domain/view-phase-as';

export const makeUpdateTurnPhaseForPlayers = ({ turnRepository, turnPhaseViewRepository }) => async ({ turnId }) => {
  const turnState = await turnRepository.getTurnById(turnId);
  const playersIds = Object.keys(turnState.playerById);
  const turnPhaseViews = playersIds.map(p => [p, viewPhaseAs(turnState, p)]);

  await Promise.all(
    turnPhaseViews.map(([playerId, phaseView]) =>
      turnPhaseViewRepository.updateTurnPhaseView({ turnId, playerId }, phaseView)
    )
  );
};
