import { events as turnEvents } from '@dixit/turn';
import { makeOnGameEventProjection } from './make-on-game-event-projection';

export const makeOnTurnStartedSubscriber = makeOnGameEventProjection(turnEvents.types.TURN_STARTED);
