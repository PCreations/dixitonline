import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { makeNullGameRepository } from '../../repos/game-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';

describe('getGames', () => {
  test('gets all the games waiting for players', async () => {
    // arrange
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([
        buildTestGame()
          .withId('g1')
          .build(),
        buildTestGame()
          .withId('g2')
          .withStartedStatus()
          .build(),
        buildTestGame()
          .withId('g3')
          .withStartedStatus()
          .build(),
        buildTestGame()
          .withId('g4')
          .build(),
      ])
      .build();
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository: makeNullGameRepository({
          nextGameId: 'g5',
          gamesData: initialGames,
        }),
      }),
      currentUserId: 'p1',
      currentUserUsername: 'player1',
    });
    const GAMES = gql`
      query Games {
        games {
          id
        }
      }
    `;

    // act
    const { query } = createTestClient(server);

    // assert
    const response = await query({ query: GAMES });
    expect(response).toMatchSnapshot();
  });
});
