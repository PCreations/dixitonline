import { makeAfterHandsCompletedSubscriber } from './after-hands-completed';
import { makeStartNewTurn } from '../useCases/start-new-turn';
import { makeUpdateTurnPhaseForPlayers } from '../useCases/update-turn-phase-for-players';
import { makeOnTurnUpdatedSubscriber } from './on-turn-updated';

export const initialize = ({
  subscribeToDomainEvent,
  dispatchDomainEvents,
  turnRepository,
  turnPhaseViewRepository,
  userRepository,
}) => {
  const startTurnUseCase = makeStartNewTurn({ turnRepository, dispatchDomainEvents });
  const updateTurnPhaseForPlayers = makeUpdateTurnPhaseForPlayers({ turnRepository, turnPhaseViewRepository });

  // initialize subscribers
  makeAfterHandsCompletedSubscriber({ subscribeToDomainEvent, userRepository, startTurn: startTurnUseCase });
  makeOnTurnUpdatedSubscriber({ subscribeToDomainEvent, updateTurnPhaseForPlayers });
};
