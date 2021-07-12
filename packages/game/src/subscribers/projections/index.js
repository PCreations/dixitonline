import { makeOnGameCreatedSubscriber } from './on-game-created';
import { makeOnPlayerJoinedSubscriber } from './on-player-joined';

export const initialize = ({ subscribeToDomainEvent, gameRepository, gameProjectionGateway }) => {
  // initialize subscribers
  makeOnGameCreatedSubscriber({ subscribeToDomainEvent, gameRepository, gameProjectionGateway });
  makeOnPlayerJoinedSubscriber({ subscribeToDomainEvent, gameRepository, gameProjectionGateway });
};
