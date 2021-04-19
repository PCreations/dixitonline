import { makeUserRepository } from '@dixit/users';
import * as TurnTypes from './infra/graphql/schema';
import { events } from './domain/events';
import { turnReducer } from './domain/reducer';
import { makeTurnRepository } from './repos';
import { initialize as initializeSubscribers } from './subscribers';
import { makeGetDataSources } from './infra/graphql/get-data-sources';
import { makeGetContext } from './infra/graphql/get-context';

export const initialize = ({
  firestore,
  firebaseAuth,
  authorizationService,
  dispatchDomainEvents,
  subscribeToDomainEvent,
}) => {
  const turnRepository = makeTurnRepository({ firestore });
  const userRepository = makeUserRepository({ firebaseAuth });
  const getDataSources = makeGetDataSources({ turnRepository });
  const getContext = makeGetContext({ dispatchDomainEvents, authorizationService });
  initializeSubscribers({ subscribeToDomainEvent, dispatchDomainEvents, turnRepository, userRepository });

  return {
    getDataSources,
    getContext,
  };
};
export { TurnTypes };
export { events };
export { turnReducer };
