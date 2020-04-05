import { events as turnEvents } from '@dixit/turn';

export const makeAfterTurnEndedUpdateScoreSubscriber = ({ subscribeToDomainEvent, updateScore }) => {
  console.log('Subsribing to TURN_ENDED in game (update score)');
  subscribeToDomainEvent(turnEvents.types.TURN_ENDED, async turnEndedEvent => {
    console.log(`[TURN_ENDED] received in game after turn ended update score`);
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
