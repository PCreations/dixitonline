import { events as turnEvents } from '@dixit/turn';

export const makeAfterTurnEndedSubscriber = ({ subscribeToDomainEvent, updateScore }) => {
  subscribeToDomainEvent(turnEvents.types.TURN_ENDED, async turnEndedEvent => {
    const { gameId, playersWithHandAndScore } = turnEndedEvent.payload;
    const turnScore = playersWithHandAndScore.reduce(
      (scores, { playerId, score }) => ({
        ...scores,
        [playerId]: score,
      }),
      {}
    );
    await updateScore({ gameId, turnScore });
  });
};
