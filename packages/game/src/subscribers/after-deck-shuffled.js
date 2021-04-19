import { v4 as uuidv4 } from 'uuid';
import { events as deckEvents } from '@dixit/decks';

export const makeAfterDeckShuffledSubscriber = ({ subscribeToDomainEvent, completeHands, uuid = uuidv4 }) => {
  subscribeToDomainEvent(deckEvents.types.DECK_SHUFFLED, async deckShuffledEvent => {
    const { gameId, cards: deckCards } = deckShuffledEvent.payload;
    const cards = deckCards.map(cardNumber => ({
      id: uuid(),
      url: `/cards/card_${cardNumber}.jpg`,
    }));
    await completeHands({ gameId, cards });
  });
};
