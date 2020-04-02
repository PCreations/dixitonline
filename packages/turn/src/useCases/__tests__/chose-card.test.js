import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { phaseFragment } from './phase-fragment';
import { viewPhaseAs } from '../../domain/view-phase-as';
import { makeNullTurnRepository } from '../../repos/turn-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestHand } from '../../__tests__/dataBuilders/hand';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { mapPhaseStateToGraphQL } from '../../infra/graphql/schema/phase';

describe('chose card', () => {
  test('a player can chose one of its clue card to add to the board', async () => {
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
    const turnHistory = buildTestTurn()
      .withId('t1')
      .withPlayers(players)
      .inPlayersCardChoicePhase()
      .getHistory();
    const turnRepository = makeNullTurnRepository({
      initialHistory: {
        t1: turnHistory,
      },
    });
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        turnRepository,
      }),
      currentUserId: players[1].id,
      currentUserUsername: players[1].name,
    });
    const TURN_CHOSE_CARD = gql`
      mutation TurnChoseCard($choseCardInput: TurnChoseCardInput!) {
        turnChoseCard(choseCardInput: $choseCardInput) {
          ... on TurnChoseCardResultSuccess {
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
      query: TURN_CHOSE_CARD,
      operationName: 'TurnChoseCard',
      variables: {
        choseCardInput: {
          turnId: 't1',
          cardId: players[1].hand[0].id,
        },
      },
    });
    const editedTurn = await turnRepository.getTurnById('t1');
    const expectedPhaseViewedAsPlayer = viewPhaseAs(editedTurn, players[1].id);
    expect(response.data.turnChoseCard.phase).toEqual(mapPhaseStateToGraphQL(expectedPhaseViewedAsPlayer));
  });
});
