import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { phaseFragment } from './phase-fragment';
import { events } from '../../domain/events';
import { viewPhaseAs } from '../../domain/view-phase-as';
import { makeNullTurnRepository } from '../../repos/turn-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestHand } from '../../__tests__/dataBuilders/hand';
import { mapPhaseStateToGraphQL } from '../../infra/graphql/schema/phase';
import { TurnError } from '../../domain/errors';
import { makeNullTurnPhaseViewRepository } from '../../repos/turn-phase-view.repository';

describe('define clue', () => {
  test('storyteller can define its clue when in storyteller phase thus making the turn to be in players card choice phase', async () => {
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
    const TURN_DEFINE_CLUE = gql`
      mutation TurnDefineClue($defineClueInput: TurnDefineClueInput!) {
        turnDefineClue(defineClueInput: $defineClueInput) {
          ... on TurnDefineClueResultSuccess {
            phase {
              ${phaseFragment}
            }
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);

    // assert
    const response = await mutate({
      query: TURN_DEFINE_CLUE,
      operationName: 'TurnDefineClue',
      variables: {
        defineClueInput: {
          turnId: 't1',
          clue: 'some clue text',
          cardId: players[0].hand[0].id,
        },
      },
    });
    const editedTurn = await turnRepository.getTurnById('t1');
    const expectedPhaseViewedAsStoryteller = viewPhaseAs(editedTurn, players[0].id);
    expect(response.data.turnDefineClue.phase).toEqual(mapPhaseStateToGraphQL(expectedPhaseViewedAsStoryteller));
  });
  test('trying to define the clue when the player is not the storyteller leads to an error', async () => {
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
      currentUserId: players[1].id,
      currentUserUsername: players[1].name,
    });
    const TURN_DEFINE_CLUE = gql`
      mutation TurnDefineClue($defineClueInput: TurnDefineClueInput!) {
        turnDefineClue(defineClueInput: $defineClueInput) {
          ... on TurnDefineClueResultError {
            type
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);

    // assert
    const response = await mutate({
      query: TURN_DEFINE_CLUE,
      operationName: 'TurnDefineClue',
      variables: {
        defineClueInput: {
          turnId: 't1',
          clue: 'some clue text',
          cardId: players[1].hand[0].id,
        },
      },
    });
    expect(response.data.turnDefineClue.type).toEqual(TurnError.NOT_AUTHORIZED);
  });
});
