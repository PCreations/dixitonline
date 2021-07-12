import { makeOnGameEventProjection } from './make-on-game-event-projection';
import * as gameEvents from '../../domain/events';

export const makeOnGameCreatedSubscriber = makeOnGameEventProjection(gameEvents.types.NEW_GAME_CREATED);
