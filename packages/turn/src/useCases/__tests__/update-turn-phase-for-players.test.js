import { viewPhaseAs } from '../../domain/view-phase-as';
import { makeNullTurnRepository } from '../../repos';
import { makeNullTurnPhaseViewRepository } from '../../repos/turn-phase-view.repository';
import { buildTestHand } from '../../__tests__/dataBuilders/hand';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { makeUpdateTurnPhaseForPlayers } from '../update-turn-phase-for-players';

describe('Update turn phase for users', () => {
  test('it updates the turn phase for each player', async () => {
    const existingPhaseViews = {};
    const players = [
      {
        id: 'p1',
        name: 'player1',
        hand: buildTestHand().build(),
      },
      {
        id: 'p2',
        name: 'player2',
        hand: buildTestHand().build(),
      },
      {
        id: 'p3',
        name: 'player3',
        hand: buildTestHand().build(),
      },
    ];
    const turnBuilder = buildTestTurn()
      .withId('t1')
      .withPlayers(players);
    const turnHistory = turnBuilder.getHistory();
    const turnState = turnBuilder.build();
    const turnPhaseViewRepository = makeNullTurnPhaseViewRepository({ existingPhaseViews });
    const turnRepository = makeNullTurnRepository({
      initialHistory: {
        t1: turnHistory,
      },
    });
    const updateTurnPhaseForPlayers = makeUpdateTurnPhaseForPlayers({ turnPhaseViewRepository, turnRepository });

    await updateTurnPhaseForPlayers({ turnId: 't1' });

    expect(existingPhaseViews['t1-p1']).toEqual(viewPhaseAs(turnState, 'p1'));
    expect(existingPhaseViews['t1-p2']).toEqual(viewPhaseAs(turnState, 'p2'));
    expect(existingPhaseViews['t1-p3']).toEqual(viewPhaseAs(turnState, 'p3'));
  });
});
