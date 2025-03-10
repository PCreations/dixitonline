import * as GameTypes from './infra/graphql/schema';
import * as events from './domain/events';
import { makeGameRepository } from './repos/game-repository';
import { initialize as initializeSubscribers } from './subscribers';
import { makeGetDataSources } from './infra/graphql/get-data-sources';
import { makeGetContext } from './infra/graphql/get-context';

export const initialize = async ({ firestore, authorizationService, dispatchDomainEvents, subscribeToDomainEvent }) => {
  const gameRepository = makeGameRepository({ firestore });
  const getDataSources = makeGetDataSources({ gameRepository });
  const getContext = makeGetContext({ dispatchDomainEvents, authorizationService, getNowDate: () => new Date() });
  await initializeSubscribers({ subscribeToDomainEvent, dispatchDomainEvents, gameRepository });

  return {
    getDataSources,
    getContext,
  };
};
export { GameTypes };
export { events };
