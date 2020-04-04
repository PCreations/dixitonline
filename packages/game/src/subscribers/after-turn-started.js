import { events as turnEvents } from '@dixit/turn';

export const makeAfterTurnStartedSubscriber = ({ subscribeToDomainEvent, setCurrentTurn }) => {
  subscribeToDomainEvent(turnEvents.types.TURN_STARTED, async turnStartedEvent => {
    const { gameId, id: turnId, storytellerId } = turnStartedEvent.payload;
    await setCurrentTurn({ gameId, turnId, storytellerId });
  });
};
