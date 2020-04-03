import { events as gameEvents } from '@dixit/game';

export const makeAfterGameStartedSubscriber = ({ subscribeToDomainEvent, getShuffledDeck }) => {
  subscribeToDomainEvent(gameEvents.types.GAME_STARTED, async gameStartedEvent => {
    const { gameId } = gameStartedEvent.payload;
    await getShuffledDeck({ gameId });
  });
};
