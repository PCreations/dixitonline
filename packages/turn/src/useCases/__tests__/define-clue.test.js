import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { TurnPhase } from '../../domain/turn';
import { makeNullTurnRepository } from '../../repos/turn-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';

describe('define clue', () => {
  test('storyteller cas define its clue when in storyteller phase thus making the turn to be in players card choice phase', async () => {
    // arrange
    const storyteller = buildTestPlayer().build();
    const turn = buildTestTurn()
      .withStoryteller(storyteller)
      .build();
    const turnRepository = makeNullTurnRepository({ initialData: { [turn.id]: turn } });
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        turnRepository,
      }),
      currentUserId: storyteller.id,
      currentUserUsername: storyteller.name,
    });
    const TURN_DEFINE_CLUE = gql`
      mutation TurnDefineClue($defineClueInput: TurnDefineClueInput!) {
        turnDefineClue(defineClueInput: $defineClueInput) {
          ... on TurnDefineClueResultSuccess {
            clue
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
      variables: { defineClueInput: { turnId: turn.id, clue: 'some clue text', cardId: storyteller.hand[0].id } },
    });
    const editedTurn = await turnRepository.getTurnById(turn.id);
    expect(response.data.turnDefineClue.clue).toEqual('some clue text');
    expect(editedTurn.phase).toBe(TurnPhase.PLAYERS_CARD_CHOICE);
  });
});
