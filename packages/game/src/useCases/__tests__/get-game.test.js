import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { makeNullGameRepository } from '../../repos/game-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';

describe('getGame', () => {
  test('gets a game by its id', async () => {
    // arrange
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([
        buildTestGame()
          .withId('g1')
          .withCurrentTurnId('t1')
          .build(),
      ])
      .build();
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository: makeNullGameRepository({
          nextGameId: 'g2',
          gamesData: initialGames,
        }),
      }),
      currentUserId: 'p1',
      currentUserUsername: 'player1',
    });
    const GET_GAME = gql`
      query GetGame($gameId: ID!) {
        game(gameId: $gameId) {
          id
          currentTurnId
          status
          players {
            score
          }
        }
      }
    `;

    // act
    const { query } = createTestClient(server);

    // assert
    const response = await query({ query: GET_GAME, variables: { gameId: 'g1' }, operationName: 'GetGame' });
    expect(response).toMatchSnapshot();
  });
});
