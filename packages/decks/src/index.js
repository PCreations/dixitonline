import { initialize as initializeSubscribers } from './subscribers';
import { events } from './events';
import { makeDeckRepository } from './repos';

export const initialize = async ({ firestore, dispatchDomainEvents, subscribeToDomainEvent }) => {
  const deckRepository = makeDeckRepository({ firestore });
  return initializeSubscribers({ subscribeToDomainEvent, dispatchDomainEvents, deckRepository });
};
export { events };
