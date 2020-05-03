import { events as gameEvents } from '@dixit/game';

export const makeAfterGameStartedSubscriber = ({ subscribeToDomainEvent, getShuffledDeck }) => {
  console.log('Subsribing to GAME_STARTED in decks');
  subscribeToDomainEvent(gameEvents.types.GAME_STARTED, async gameStartedEvent => {
    console.log(`[GAME STARTED] received in decks after game started`);
    const { gameId, useAllDeck } = gameStartedEvent.payload;
    await getShuffledDeck({ gameId, useAllDeck });
  });
};
