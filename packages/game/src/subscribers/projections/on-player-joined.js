import { makeOnGameEventProjection } from './make-on-game-event-projection';
import * as gameEvents from '../../domain/events';

export const makeOnPlayerJoinedSubscriber = makeOnGameEventProjection(gameEvents.types.PLAYER_JOINED);
