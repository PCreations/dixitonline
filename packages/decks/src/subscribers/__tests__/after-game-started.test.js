import { EventEmitter } from 'events';
import { shuffle as shuffleWithSeed } from 'shuffle-seed';
import { events as gameEvents } from '@dixit/game';
import { makeAfterGameStartedSubscriber } from '../after-game-started';
import { makeGetShuffledDeck } from '../../useCases/get-shuffled-deck';

describe('after game started subscriber', () => {
  test('it should call the shuffle deck use case when a new game has been started', async () => {
    // arrange
    expect.assertions(1);
    const shuffle = toShuffle => shuffleWithSeed(toShuffle, 'seed');
    const eventEmitter = new EventEmitter();
    const dispatchDomainEvents = events => events.map(event => eventEmitter.emit(event.type, event));
    const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);
    const getShuffledDeck = makeGetShuffledDeck({ shuffle, dispatchDomainEvents });
    const getShuffledDeckSpy = jest.spyOn({ getShuffledDeck }, 'getShuffledDeck');
    makeAfterGameStartedSubscriber({
      subscribeToDomainEvent,
      getShuffledDeck: getShuffledDeckSpy,
    });

    // act
    dispatchDomainEvents([
      gameEvents.newGameStartedEvent({
        gameId: 'g1',
        playerIds: ['p1,', 'p2', 'p3'],
      }),
    ]);

    // assert
    expect(getShuffledDeckSpy).toHaveBeenCalledWith({ gameId: 'g1' });
  });
});
