import { EventEmitter } from 'events';
import { events as turnEvents } from '../../domain/events';
import { makeNullTurnRepository } from '../../repos';
import { makeNullTurnPhaseViewRepository } from '../../repos/turn-phase-view.repository';
import { makeUpdateTurnPhaseForPlayers } from '../../useCases/update-turn-phase-for-players';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { makeOnTurnUpdatedSubscriber } from '../on-turn-updated';

describe('On turn updated', () => {
  test('it should update all players phase views', done => {
    const existingPhaseViews = {};
    const players = [buildTestPlayer().build(), buildTestPlayer().build(), buildTestPlayer().build()];
    const turnHistory = buildTestTurn()
      .withId('t1')
      .withPlayers(players)
      .getHistory();
    const turnPhaseViewRepository = makeNullTurnPhaseViewRepository({ existingPhaseViews });
    const turnRepository = makeNullTurnRepository({
      initialHistory: {
        t1: turnHistory,
      },
    });
    const eventEmitter = new EventEmitter();
    const dispatchDomainEvents = events => events.map(event => eventEmitter.emit(event.type, event));
    const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);
    const updateTurnPhaseForPlayers = jest.fn(
      makeUpdateTurnPhaseForPlayers({ turnRepository, turnPhaseViewRepository })
    );
    makeOnTurnUpdatedSubscriber({ subscribeToDomainEvent, updateTurnPhaseForPlayers });

    dispatchDomainEvents([turnEvents.turnUpdated({ id: 't1' })]);

    setTimeout(() => {
      expect(updateTurnPhaseForPlayers).toHaveBeenCalledWith({ turnId: 't1' });
      done();
    }, 0);
  });
});
