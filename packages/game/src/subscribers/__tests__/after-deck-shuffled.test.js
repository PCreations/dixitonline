import { EventEmitter } from 'events';
import { events as deckEvents } from '@dixit/decks';
import { buildTestCard } from '../../__tests__/dataBuilders/card';
import { makeAfterDeckShuffledSubscriber } from '../after-deck-shuffled';
import { makeNullGameRepository } from '../../repos';
import { makeCompleteHands } from '../../useCases/complete-hands';

describe('after deck shuffled subscriber', () => {
  test('it should call the completeHands use case when the deck for this game has been shuffled', async () => {
    // arrange
    expect.assertions(1);
    const cards = [
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
    ];
    const gameRepository = makeNullGameRepository({});
    const eventEmitter = new EventEmitter();
    const dispatchDomainEvents = events => events.map(event => eventEmitter.emit(event.type, event));
    const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);
    const completeHands = jest.fn(makeCompleteHands({ gameRepository, dispatchDomainEvents }));
    makeAfterDeckShuffledSubscriber({
      subscribeToDomainEvent,
      completeHands,
    });

    // act
    dispatchDomainEvents([
      deckEvents.deckShuffled({
        gameId: 'g1',
        cards,
      }),
    ]);

    // assert
    expect(completeHands).toHaveBeenCalledWith({ gameId: 'g1', cards });
  });
});
