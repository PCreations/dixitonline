import { makeAfterDeckShuffledSubscriber } from './after-deck-shuffled';
import { makeAfterTurnEndedSubscriber } from './after-turn-ended';
import { makeAfterTurnStartedSubscriber } from './after-turn-started';
import { makeCompleteHands } from '../useCases/complete-hands';
import { makeHandleTurnEnded } from '../useCases/handle-turn-ended';
import { makeSetCurrentTurn } from '../useCases/set-current-turn';

export const initialize = async ({ subscribeToDomainEvent, dispatchDomainEvents, gameRepository }) => {
  const completeHandsUseCase = makeCompleteHands({ dispatchDomainEvents, gameRepository });
  const handleTurnEndedUseCase = makeHandleTurnEnded({ dispatchDomainEvents, gameRepository });
  const setCurrentTurnUseCase = makeSetCurrentTurn({ gameRepository });

  // initialize subscribers
  await makeAfterDeckShuffledSubscriber({ subscribeToDomainEvent, completeHands: completeHandsUseCase });
  await makeAfterTurnEndedSubscriber({ subscribeToDomainEvent, handleTurnEnded: handleTurnEndedUseCase });
  await makeAfterTurnStartedSubscriber({ subscribeToDomainEvent, setCurrentTurn: setCurrentTurnUseCase });
};
