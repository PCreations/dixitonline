import { events as turnEvents } from '@dixit/turn';

export const makeAfterTurnEndedSubscriber = async ({ subscribeToDomainEvent, handleTurnEnded }) => {
  await subscribeToDomainEvent(turnEvents.types.TURN_ENDED, async turnEndedEvent => {
    const { gameId, playersWithHandAndScore, id: previousTurnId, discardedCards } = turnEndedEvent.payload;
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
    await handleTurnEnded({ gameId, actualHandsByPlayerId, previousTurnId, turnScore, discardedCards });
  });
};
