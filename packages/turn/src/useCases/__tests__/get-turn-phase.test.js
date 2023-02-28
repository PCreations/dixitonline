import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { phaseFragment } from './phase-fragment';
import { events } from '../../domain/events';
import { viewPhaseAs } from '../../domain/view-phase-as';
import { mapPhaseStateToGraphQL } from '../../infra/graphql/schema/phase';
import { makeNullTurnRepository } from '../../repos/turn-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestHand } from '../../__tests__/dataBuilders/hand';
import { makeNullTurnPhaseViewRepository } from '../../repos/turn-phase-view.repository';

describe('getTurnPhase', () => {
  test('correctly get the current phase', async () => {
    // arrange
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
    const turnStarted = events.turnStarted({
      id: 't1',
      storytellerId: players[0].id,
      players,
    });
    const turnRepository = makeNullTurnRepository({
      initialHistory: {
        t1: [turnStarted],
      },
    });
    const turnPhaseViewRepository = makeNullTurnPhaseViewRepository();
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        turnRepository,
        turnPhaseViewRepository,
      }),
      currentUserId: players[0].id,
      currentUserUsername: players[0].name,
    });
    const GET_TURN_PHASE = gql`
        query GetTurnPhase($turnId: ID!) {
          getTurnPhase(turnId: $turnId) {
            ${phaseFragment}
          }
        }
      `;

    // act
    const { query } = createTestClient(server);

    // assert
    const response = await query({
      query: GET_TURN_PHASE,
      operationName: 'GetTurnPhase',
      variables: { turnId: 't1' },
    });
    const turn = await turnRepository.getTurnById('t1');
    expect(response.data.getTurnPhase).toEqual(mapPhaseStateToGraphQL(viewPhaseAs(turn, players[0].id)));
  });
});
