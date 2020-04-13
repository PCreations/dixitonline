import { v4 as uuidv4 } from 'uuid';
import { events as deckEvents } from '@dixit/decks';

export const makeAfterDeckShuffledSubscriber = ({ subscribeToDomainEvent, completeHands, uuid = uuidv4 }) => {
  console.log('Subsribing to DECK_SHUFFLED in game');
  subscribeToDomainEvent(deckEvents.types.DECK_SHUFFLED, async deckShuffledEvent => {
    console.log(`[DECK_SHUFFLED] received in game after deck shuffled`);
    const { gameId, cards: deckCards } = deckShuffledEvent.payload;
    const cards = deckCards.map(cardNumber => ({
      id: uuid(),
      url: `/cards/card_${cardNumber}.jpg`,
    }));
    await completeHands({ gameId, cards });
  });
};
