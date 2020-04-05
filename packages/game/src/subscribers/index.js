import { makeAfterDeckShuffledSubscriber } from './after-deck-shuffled';
import { makeAfterTurnEndedCompleteHandsSubscriber } from './after-turn-ended-complete-hands';
import { makeAfterTurnEndedUpdateScoreSubscriber } from './after-turn-ended-update-score';
import { makeAfterTurnStartedSubscriber } from './after-turn-started';
import { makeCompleteHands } from '../useCases/complete-hands';
import { makeUpdateScore } from '../useCases/update-score';
import { makeSetCurrentTurn } from '../useCases/set-current-turn';

export const initialize = ({ subscribeToDomainEvent, dispatchDomainEvents, gameRepository }) => {
  const completeHandsUseCase = makeCompleteHands({ dispatchDomainEvents, gameRepository });
  const updateScoreUseCase = makeUpdateScore({ gameRepository });
  const setCurrentTurnUseCase = makeSetCurrentTurn({ gameRepository });

  // initialize subscribers
  makeAfterDeckShuffledSubscriber({ subscribeToDomainEvent, completeHands: completeHandsUseCase });
  makeAfterTurnEndedCompleteHandsSubscriber({ subscribeToDomainEvent, completeHands: completeHandsUseCase });
  makeAfterTurnEndedUpdateScoreSubscriber({ subscribeToDomainEvent, updateScore: updateScoreUseCase });
  makeAfterTurnStartedSubscriber({ subscribeToDomainEvent, setCurrentTurn: setCurrentTurnUseCase });
};
