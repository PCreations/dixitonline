import { shuffle as shuffleWithSeed } from 'shuffle-seed';
import { events as deckEvents } from '../../events';
import { makeGetShuffledDeck } from '../get-shuffled-deck';

const CARDS_COUNT = 372;
const MIN_CARDS_IN_DECK_PER_PLAYER = 14;
const MAX_PLAYERS = 6;
const DEFAULT_GAME_CARDS_COUNT = MIN_CARDS_IN_DECK_PER_PLAYER * MAX_PLAYERS;

describe('get shuffled deck', () => {
  it(`returns ${DEFAULT_GAME_CARDS_COUNT} card name where the card number is between 1 and ${CARDS_COUNT}`, async () => {
    // arrange
    const shuffle = toShuffle => shuffleWithSeed(toShuffle, 'seed');
    const dispatchDomainEvents = jest.fn();
    const getShuffledDeck = makeGetShuffledDeck({ shuffle, dispatchDomainEvents });

    // act
    const shuffledDeck = await getShuffledDeck({ gameId: 'g1', playersCount: 6 });

    // assert
    expect(shuffledDeck.cards.length).toEqual(DEFAULT_GAME_CARDS_COUNT);
    expect(shuffledDeck.cards.every(cardNumber => cardNumber >= 1 && cardNumber <= CARDS_COUNT));
    expect(dispatchDomainEvents).toHaveBeenCalledWith([
      deckEvents.deckShuffled({ gameId: 'g1', cards: shuffledDeck.cards }),
    ]);
  });
  it(`returns ${CARDS_COUNT} card name where the card number is between 1 and ${CARDS_COUNT} when using all deck`, async () => {
    // arrange
    const shuffle = toShuffle => shuffleWithSeed(toShuffle, 'seed');
    const dispatchDomainEvents = jest.fn();
    const getShuffledDeck = makeGetShuffledDeck({ shuffle, dispatchDomainEvents });

    // act
    const shuffledDeck = await getShuffledDeck({ gameId: 'g1', useAllDeck: true });

    // assert
    expect(shuffledDeck.cards.length).toEqual(CARDS_COUNT);
    expect(shuffledDeck.cards.every(cardNumber => cardNumber >= 1 && cardNumber <= CARDS_COUNT));
    expect(dispatchDomainEvents).toHaveBeenCalledWith([
      deckEvents.deckShuffled({ gameId: 'g1', cards: shuffledDeck.cards }),
    ]);
  });
});
