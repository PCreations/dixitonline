import { makeAfterHandsCompletedSubscriber } from './after-hands-completed';
import { makeStartNewTurn } from '../useCases/start-new-turn';

export const initialize = ({ subscribeToDomainEvent, dispatchDomainEvents, turnRepository, userRepository }) => {
  const startTurnUseCase = makeStartNewTurn({ turnRepository, dispatchDomainEvents });

  // initialize subscribers
  makeAfterHandsCompletedSubscriber({ subscribeToDomainEvent, userRepository, startTurn: startTurnUseCase });
};
