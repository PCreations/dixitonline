import { events as turnEvents } from '@dixit/turn';

export const makeAfterTurnEndedSubscriber = ({ subscribeToDomainEvent, completeHands }) => {
  subscribeToDomainEvent(turnEvents.types.TURN_ENDED, async turnEndedEvent => {
    const { gameId, playersWithHandAndScore } = turnEndedEvent.payload;
    const actualHandsByPlayerId = playersWithHandAndScore.reduce(
      (hands, { playerId, hand }) => ({
        ...hands,
        [playerId]: hand,
      }),
      {}
    );
    await completeHands({ gameId, actualHandsByPlayerId });
  });
};
