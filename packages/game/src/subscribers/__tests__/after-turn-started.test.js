import { EventEmitter } from 'events';
import { events as turnEvents } from '@dixit/turn';
import { makeAfterTurnStartedSubscriber } from '../after-turn-started';
import { makeNullGameRepository } from '../../repos';
import { makeSetCurrentTurn } from '../../useCases/set-current-turn';
import { buildTestGame } from '../../__tests__/dataBuilders/game';

describe('after turn started subscriber', () => {
  test('it should set the current turn id', async () => {
    // arrange
    expect.assertions(1);
    const gameRepository = makeNullGameRepository({
      gamesData: {
        g1: buildTestGame()
          .withId('g1')
          .build(),
      },
    });
    const eventEmitter = new EventEmitter();
    const dispatchDomainEvents = events => events.map(event => eventEmitter.emit(event.type, event));
    const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);
    const setCurrentTurn = jest.fn(makeSetCurrentTurn({ gameRepository }));
    makeAfterTurnStartedSubscriber({
      subscribeToDomainEvent,
      setCurrentTurn,
    });

    // act
    dispatchDomainEvents([
      turnEvents.turnStarted({
        gameId: 'g1',
        id: 't1',
        storytellerId: 'p1',
      }),
    ]);

    // assert
    expect(setCurrentTurn).toHaveBeenCalledWith({ gameId: 'g1', turnId: 't1', storytellerId: 'p1' });
  });
});
