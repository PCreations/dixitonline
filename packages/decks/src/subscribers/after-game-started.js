import { events as gameEvents } from '@dixit/game';

export const makeAfterGameStartedSubscriber = ({ subscribeToDomainEvent, getShuffledDeck }) => {
  subscribeToDomainEvent(gameEvents.types.GAME_STARTED, async gameStartedEvent => {
    const { gameId, playerIds, useAllDeck } = gameStartedEvent.payload;
    await getShuffledDeck({ gameId, playersCount: playerIds.length, useAllDeck });
  });
};
