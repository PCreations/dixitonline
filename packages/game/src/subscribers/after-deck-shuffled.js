import { events as deckEvents } from '@dixit/decks';

export const makeAfterDeckShuffledSubscriber = ({ subscribeToDomainEvent, completeHands }) => {
  subscribeToDomainEvent(deckEvents.types.DECK_SHUFFLED, async deckShuffledEvent => {
    const { gameId, cards } = deckShuffledEvent.payload;
    await completeHands({ gameId, cards });
  });
};
