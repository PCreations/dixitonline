import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { makeNullLobbyRepository } from '../../repos/lobby-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeTestServer } from '../../testsUtils/test-server';

describe('getGames', () => {
  test('gets all the lobby games', async () => {
    // arrange
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        lobbyRepository: makeNullLobbyRepository({
          nextGameId: 'g3',
          gamesData: { g1: { id: 'g1' }, g2: { id: 'g2' } },
        }),
      }),
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
