import { events as turnEvents } from '@dixit/turn';

export const makeAfterTurnEndedSubscriber = ({ subscribeToDomainEvent, handleTurnEnded }) => {
  console.log('Subsribing to TURN_ENDED in game (complete hands');
  subscribeToDomainEvent(turnEvents.types.TURN_ENDED, async turnEndedEvent => {
    console.log(`[TURN_ENDED] received in game after turn ended complete hands`);
    const { gameId, playersWithHandAndScore, id: previousTurnId } = turnEndedEvent.payload;
    const actualHandsByPlayerId = playersWithHandAndScore.reduce(
      (hands, { playerId, hand }) => ({
        ...hands,
        [playerId]: hand,
      }),
      {}
    );
    const turnScore = playersWithHandAndScore.reduce(
      (scores, { playerId, score }) => ({
        ...scores,
        [playerId]: score,
      }),
      {}
    );
    await handleTurnEnded({ gameId, actualHandsByPlayerId, previousTurnId, turnScore });
  });
};
