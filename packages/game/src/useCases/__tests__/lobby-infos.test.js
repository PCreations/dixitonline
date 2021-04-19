import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { makeNullGameRepository } from '../../repos/game-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';

describe('lobbyInfos', () => {
  test('gets the lobby infos about public games and connected players', async () => {
    // arrange
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([
        buildTestGame()
          .withXPlayers(3)
          .asPublic()
          .build(),
        buildTestGame()
          .withXPlayers(2)
          .asPublic()
          .build(),
        buildTestGame()
          .withXPlayers(5)
          .build(),
      ])
      .build();
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository: makeNullGameRepository({
          gamesData: initialGames,
        }),
      }),
    });
    const LOBBY_INFOS = gql`
      query LobbyInfos {
        lobbyInfos {
          waitingGames
          connectedPlayers
        }
      }
    `;

    // act
    const { query } = createTestClient(server);

    // assert
    const response = await query({ query: LOBBY_INFOS, operationName: 'LobbyInfos' });
    expect(response.data.lobbyInfos).toEqual({
      waitingGames: 2,
      connectedPlayers: 13,
    });
  });
});
