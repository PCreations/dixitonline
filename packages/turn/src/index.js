import { makeUserRepository } from '@dixit/users';
import * as TurnTypes from './infra/graphql/schema';
import { events } from './domain/events';
import { turnReducer } from './domain/reducer';
import { makeTurnRepository } from './repos';
import { initialize as initializeSubscribers } from './subscribers';
import { makeGetDataSources } from './infra/graphql/get-data-sources';
import { makeGetContext } from './infra/graphql/get-context';
import { makeTurnPhaseViewRepository } from './repos/turn-phase-view.repository';

export const initialize = async ({
  firestore,
  firebaseAuth,
  authorizationService,
  dispatchDomainEvents,
  subscribeToDomainEvent,
}) => {
  const turnRepository = makeTurnRepository({ firestore });
  const turnPhaseViewRepository = makeTurnPhaseViewRepository({ firestore });
  const userRepository = makeUserRepository({ firebaseAuth });
  const getDataSources = makeGetDataSources({ turnRepository, turnPhaseViewRepository });
  const getContext = makeGetContext({ dispatchDomainEvents, authorizationService });
  await initializeSubscribers({
    subscribeToDomainEvent,
    dispatchDomainEvents,
    turnRepository,
    turnPhaseViewRepository,
    userRepository,
  });

  return {
    getDataSources,
    getContext,
  };
};
export { TurnTypes };
export { events };
export { turnReducer };
