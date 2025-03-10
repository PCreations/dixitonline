import { events as turnEvents } from '@dixit/turn';

export const makeAfterTurnStartedSubscriber = async ({ subscribeToDomainEvent, setCurrentTurn }) => {
  await subscribeToDomainEvent(turnEvents.types.TURN_STARTED, async turnStartedEvent => {
    const { gameId, id: turnId, storytellerId } = turnStartedEvent.payload;
    await setCurrentTurn({ gameId, turnId, storytellerId });
  });
};
