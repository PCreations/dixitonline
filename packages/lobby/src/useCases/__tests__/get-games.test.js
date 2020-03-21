import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { makeNullLobbyRepository } from '../../repos/lobby-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildLobbyRepositoryInitialGames } from '../../__tests__/dataBuilders/lobby-repository-initial-games';

describe('getGames', () => {
  test('gets all the lobby games', async () => {
    // arrange
    const initialGames = buildLobbyRepositoryInitialGames()
      .withGames([
        buildTestGame()
          .withId('g1')
          .build(),
        buildTestGame()
          .withId('g2')
          .build(),
      ])
      .build();

    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        lobbyRepository: makeNullLobbyRepository({
          nextGameId: 'g3',
          gamesData: initialGames,
        }),
      }),
      currentUserId: 'p1',
      currentUserUsername: 'player1',
    });
    const LOBBY_GAMES = gql`
      query LobbyGames {
        lobbyGames {
          id
        }
      }
    `;

    // act
    const { query } = createTestClient(server);

    // assert
    const response = await query({ query: LOBBY_GAMES });
    expect(response).toMatchSnapshot();
  });
});
