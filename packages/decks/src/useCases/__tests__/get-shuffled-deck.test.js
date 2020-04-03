import { shuffle as shuffleWithSeed } from 'shuffle-seed';
import { events as deckEvents } from '../../events';
import { makeNullDeckRepository } from '../../repos';
import { makeGetShuffledDeck } from '../get-shuffled-deck';

describe('get shuffled deck', () => {
  it('retrieves the deck shuffled', async () => {
    // arrange
    const cards = [
      { id: 'c1', url: 'http://example.com/c1.png' },
      { id: 'c1', url: 'http://example.com/c1.png' },
      { id: 'c1', url: 'http://example.com/c1.png' },
    ];
    const shuffle = toShuffle => shuffleWithSeed(toShuffle, 'seed');
    const expectedShuffledCards = shuffle(cards);
    const deckRepository = makeNullDeckRepository({ defaultDeckCards: cards });
    const dispatchDomainEvents = jest.fn();
    const getShuffledDeck = makeGetShuffledDeck({ deckRepository, shuffle, dispatchDomainEvents });

    // act
    const shuffledDeck = await getShuffledDeck({ gameId: 'g1' });

    // assert
    expect(shuffledDeck.cards).toEqual(expectedShuffledCards);
    expect(dispatchDomainEvents).toHaveBeenCalledWith([
      deckEvents.deckShuffled({ gameId: 'g1', cards: shuffledDeck.cards }),
    ]);
  });
});
