import { EventEmitter } from 'events';
import { shuffle as shuffleWithSeed } from 'shuffle-seed';
import { events as gameEvents } from '@dixit/game';
import { makeAfterGameStartedSubscriber } from '../after-game-started';
import { events as deckEvents } from '../../events';
import { makeNullDeckRepository } from '../../repos';
import { makeGetShuffledDeck } from '../../useCases/get-shuffled-deck';

describe('after game started subscriber', () => {
  test('it should call the shuffle deck use case when a new game has been started', async () => {
    // arrange
    expect.assertions(1);
    const cards = [
      {
        id: 'c1',
        url: 'http://example.com/c1.png',
      },
      {
        id: 'c1',
        url: 'http://example.com/c1.png',
      },
      {
        id: 'c1',
        url: 'http://example.com/c1.png',
      },
    ];
    const shuffle = toShuffle => shuffleWithSeed(toShuffle, 'seed');
    const expectedShuffledCards = shuffle(cards);
    const deckRepository = makeNullDeckRepository({
      defaultDeckCards: cards,
    });
    const eventEmitter = new EventEmitter();
    const dispatchDomainEvents = events => events.map(event => eventEmitter.emit(event.type, event));
    const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);
    const getShuffledDeck = makeGetShuffledDeck({ deckRepository, shuffle, dispatchDomainEvents });
    makeAfterGameStartedSubscriber({
      subscribeToDomainEvent,
      getShuffledDeck,
    });
    const waitForEvent = new Promise(resolve => {
      subscribeToDomainEvent(deckEvents.types.DECK_SHUFFLED, resolve);
    });

    // act
    dispatchDomainEvents([
      gameEvents.newGameStartedEvent({
        gameId: 'g1',
        playerIds: ['p1,', 'p2', 'p3'],
      }),
    ]);

    // assert
    await expect(waitForEvent).resolves.toEqual(
      deckEvents.deckShuffled({ gameId: 'g1', cards: expectedShuffledCards })
    );
  });
});
