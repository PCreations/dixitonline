import { shuffle as shuffleWithSeed } from 'shuffle-seed';
import { events as deckEvents } from '../../events';
import { makeGetShuffledDeck } from '../get-shuffled-deck';

describe('get shuffled deck', () => {
  it('returns 84 card name where the card number is between 1 and 296', async () => {
    // arrange
    const shuffle = toShuffle => shuffleWithSeed(toShuffle, 'seed');
    const dispatchDomainEvents = jest.fn();
    const getShuffledDeck = makeGetShuffledDeck({ shuffle, dispatchDomainEvents });

    // act
    const shuffledDeck = await getShuffledDeck({ gameId: 'g1' });

    // assert
    expect(shuffledDeck.cards.length).toEqual(84);
    expect(shuffledDeck.cards.every(cardNumber => cardNumber >= 1 && cardNumber <= 296));
    expect(dispatchDomainEvents).toHaveBeenCalledWith([
      deckEvents.deckShuffled({ gameId: 'g1', cards: shuffledDeck.cards }),
    ]);
  });
  it('returns 296 card name where the card number is between 1 and 296 when using all deck', async () => {
    // arrange
    const shuffle = toShuffle => shuffleWithSeed(toShuffle, 'seed');
    const dispatchDomainEvents = jest.fn();
    const getShuffledDeck = makeGetShuffledDeck({ shuffle, dispatchDomainEvents });

    // act
    const shuffledDeck = await getShuffledDeck({ gameId: 'g1', useAllDeck: true });

    // assert
    expect(shuffledDeck.cards.length).toEqual(296);
    expect(shuffledDeck.cards.every(cardNumber => cardNumber >= 1 && cardNumber <= 296));
    expect(dispatchDomainEvents).toHaveBeenCalledWith([
      deckEvents.deckShuffled({ gameId: 'g1', cards: shuffledDeck.cards }),
    ]);
  });
});
