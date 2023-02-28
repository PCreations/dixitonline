import { events } from '../domain/events';

export const makeOnTurnUpdatedSubscriber = async ({ subscribeToDomainEvent, updateTurnPhaseForPlayers }) => {
  subscribeToDomainEvent(events.types.TURN_UPDATED, async turnUpdatedEvent => {
    const turnId = turnUpdatedEvent.payload.id;

    return updateTurnPhaseForPlayers({ turnId });
  });
};
