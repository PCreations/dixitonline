import { makeTurnPhaseViewRepository } from '../../repos/turn-phase-view.repository';
import { makeTurnRepository } from '../../repos/turn-repository';

export const makeGetDataSources = ({
  turnRepository = makeTurnRepository(),
  turnPhaseViewRepository = makeTurnPhaseViewRepository(),
} = {}) => () => ({
  turnRepository,
  turnPhaseViewRepository,
});
