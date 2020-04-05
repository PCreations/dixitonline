import { initialize as initializeSubscribers } from './subscribers';
import { events } from './events';
import { makeDeckRepository } from './repos';

export const initialize = ({ firestore, dispatchDomainEvents, subscribeToDomainEvent }) => {
  const deckRepository = makeDeckRepository({ firestore });
  initializeSubscribers({ subscribeToDomainEvent, dispatchDomainEvents, deckRepository });
};
export { events };
