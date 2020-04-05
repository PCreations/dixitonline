import { events as turnEvents } from '@dixit/turn';

export const makeAfterTurnStartedSubscriber = ({ subscribeToDomainEvent, setCurrentTurn }) => {
  console.log('Subsribing to TURN_STARTED in game');
  subscribeToDomainEvent(turnEvents.types.TURN_STARTED, async turnStartedEvent => {
    console.log(`[TURN_STARTED] received in game after turn started`);
    const { gameId, id: turnId, storytellerId } = turnStartedEvent.payload;
    await setCurrentTurn({ gameId, turnId, storytellerId });
  });
};
