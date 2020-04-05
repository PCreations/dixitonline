import { EventEmitter } from 'events';
import { events as deckEvents } from '@dixit/decks';
import { makeAfterDeckShuffledSubscriber } from '../after-deck-shuffled';
import { makeNullGameRepository } from '../../repos';
import { makeCompleteHands } from '../../useCases/complete-hands';

describe('after deck shuffled subscriber', () => {
  test('it should call the completeHands use case when the deck for this game has been shuffled', async () => {
    // arrange
    expect.assertions(1);
    const cardsFromDecks = ['01.png', '02.png', '03.png', '04.png', '05.png'];
    const gameRepository = makeNullGameRepository({});
    const eventEmitter = new EventEmitter();
    const dispatchDomainEvents = events => events.map(event => eventEmitter.emit(event.type, event));
    const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);
    const completeHands = jest.fn(makeCompleteHands({ gameRepository, dispatchDomainEvents }));
    makeAfterDeckShuffledSubscriber({
      subscribeToDomainEvent,
      completeHands,
      uuid: () => 'someCardId',
    });

    // act
    dispatchDomainEvents([
      deckEvents.deckShuffled({
        gameId: 'g1',
        cards: cardsFromDecks,
      }),
    ]);

    // assert
    expect(completeHands).toHaveBeenCalledWith({
      gameId: 'g1',
      cards: [
        {
          id: 'someCardId',
          url: '01.png',
        },
        {
          id: 'someCardId',
          url: '02.png',
        },
        {
          id: 'someCardId',
          url: '03.png',
        },
        {
          id: 'someCardId',
          url: '04.png',
        },
        {
          id: 'someCardId',
          url: '05.png',
        },
      ],
    });
  });
});
