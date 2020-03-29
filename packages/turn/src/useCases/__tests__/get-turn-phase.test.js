import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { makeNullTurnRepository } from '../../repos/turn-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';

describe('getTurnPhase', () => {
  describe('storyteller phase', () => {
    test('viewed as storyteller', async () => {
      // arrange
      const storyteller = buildTestPlayer().build();
      const otherPlayers = [buildTestPlayer().build(), buildTestPlayer().build()];
      const turn = buildTestTurn()
        .withStorytellerId(storyteller.id)
        .withPlayers([storyteller, ...otherPlayers])
        .build();
      const turnRepository = makeNullTurnRepository({ initialData: { [turn.id]: turn } });
      const server = makeTestServer({
        getDataSources: makeGetDataSources({
          turnRepository,
        }),
        currentUserId: storyteller.id,
        currentUserUsername: storyteller.name,
      });
      const GET_TURN_PHASE = gql`
        query GetTurnPhase($turnId: ID!) {
          getTurnPhase(turnId: $turnId) {
            name
            storytellerId
            hand {
              id
              url
            }
          }
        }
      `;

      // act
      const { query } = createTestClient(server);

      // assert
      const response = await query({
        query: GET_TURN_PHASE,
        operationName: 'GetTurnPhase',
        variables: { turnId: turn.id },
      });
      expect(response.data.getTurnPhase).toEqual({
        name: turn.phase,
        storytellerId: storyteller.id,
        hand: storyteller.hand,
      });
    });
    test('viewed as a player', async () => {
      // arrange
      const storyteller = buildTestPlayer().build();
      const otherPlayers = [buildTestPlayer().build(), buildTestPlayer().build()];
      const turn = buildTestTurn()
        .withStorytellerId(storyteller.id)
        .withPlayers([storyteller, ...otherPlayers])
        .build();
      const turnRepository = makeNullTurnRepository({ initialData: { [turn.id]: turn } });
      const server = makeTestServer({
        getDataSources: makeGetDataSources({
          turnRepository,
        }),
        currentUserId: otherPlayers[0].id,
        currentUserUsername: otherPlayers[0].name,
      });
      const GET_TURN_PHASE = gql`
        query GetTurnPhase($turnId: ID!) {
          getTurnPhase(turnId: $turnId) {
            name
            storytellerId
            hand {
              id
              url
            }
          }
        }
      `;

      // act
      const { query } = createTestClient(server);

      // assert
      const response = await query({
        query: GET_TURN_PHASE,
        operationName: 'GetTurnPhase',
        variables: { turnId: turn.id },
      });
      expect(response.data.getTurnPhase).toEqual({
        name: turn.phase,
        storytellerId: storyteller.id,
        hand: otherPlayers[0].hand,
      });
    });
  });
});
