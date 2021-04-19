import { events as gameEvents } from '@dixit/game';

export const makeAfterHandsCompletedSubscriber = async ({ subscribeToDomainEvent, userRepository, startTurn }) => {
  subscribeToDomainEvent(gameEvents.types.HANDS_COMPLETED, async handsCompletedEvent => {
    const { gameId, handsByPlayerId, previousTurnId } = handsCompletedEvent.payload;
    const players = await Promise.all(
      Object.keys(handsByPlayerId).map(async playerId => {
        const user = await userRepository.getUserById(playerId);
        return {
          ...user,
          hand: handsByPlayerId[playerId],
        };
      })
    );
    await startTurn({ gameId, players, previousTurnId });
  });
};
