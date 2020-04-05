import { EventEmitter } from 'events';
import { events as gameEvents } from '@dixit/game';
import { makeNullUserRepository } from '@dixit/users';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { makeNullTurnRepository } from '../../repos/turn-repository';
import { makeStartNewTurn } from '../../useCases/start-new-turn';
import { makeAfterHandsCompletedSubscriber } from '../after-hands-completed';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';

describe('after hands completed', () => {
  test('it should start a new turn', done => {
    // arrange
    const players = [buildTestPlayer().build(), buildTestPlayer().build(), buildTestPlayer().build()];
    const handsByPlayerId = {
      [players[0].id]: players[0].hand,
      [players[1].id]: players[1].hand,
      [players[2].id]: players[2].hand,
    };
    const turnHistory = buildTestTurn()
      .withId('t1')
      .withPlayers(players)
      .getHistory();
    const turnRepository = makeNullTurnRepository({
      initialHistory: {
        t1: turnHistory,
      },
    });
    const userRepository = makeNullUserRepository({
      users: {
        [players[0].id]: { displayName: players[0].name },
        [players[1].id]: { displayName: players[1].name },
        [players[2].id]: { displayName: players[2].name },
      },
    });
    const eventEmitter = new EventEmitter();
    const dispatchDomainEvents = events => events.map(event => eventEmitter.emit(event.type, event));
    const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);
    const startTurn = jest.fn(makeStartNewTurn({ turnRepository, dispatchDomainEvents }));
    makeAfterHandsCompletedSubscriber({
      subscribeToDomainEvent,
      userRepository,
      startTurn,
    });

    // act
    dispatchDomainEvents([
      gameEvents.handsCompletedEvent({
        gameId: 'g1',
        handsByPlayerId,
        previousTurnId: 't1',
      }),
    ]);

    // assert
    setTimeout(() => {
      expect(startTurn).toHaveBeenCalledWith({
        gameId: 'g1',
        players,
        previousTurnId: 't1',
      });
      done();
    }, 0);
  });
});
