import gql from 'graphql-tag';
import { createTestClient } from 'apollo-server-testing';
import { makeTestServer } from '../../__tests__/test-server';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildLobbyRepositoryInitialGames } from '../../__tests__/dataBuilders/lobby-repository-initial-games';
import { makeNullLobbyRepository, GameNotFoundError } from '../../repos';

describe('start game', () => {
  test('a game with more than 2 players can be started by the host', async () => {
    // arrange
    const game = buildTestGame()
      .withId('g42')
      .withXPlayers(3)
      .build();
    const initialGames = buildLobbyRepositoryInitialGames()
      .withGames([game])
      .build();
    const lobbyRepository = makeNullLobbyRepository({
      gamesData: initialGames,
    });
    const dispatchDomainEvents = jest.fn();
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        lobbyRepository,
      }),
      dispatchDomainEvents,
      currentUserId: game.host.id,
      currentUserUsername: game.host.name,
    });
    const LOBBY_START_GAME = gql`
      mutation LobbyStartGame($lobbyStartGameInput: LobbyStartGameInput!) {
        lobbyStartGame(lobbyStartGameInput: $lobbyStartGameInput) {
          gameId
        }
      }
    `;

    // act
    expect.assertions(2);
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: LOBBY_START_GAME,
      variables: { lobbyStartGameInput: { gameId: 'g42' } },
      operationName: 'LobbyStartGame',
    });
    expect(response).toMatchSnapshot();
    await expect(lobbyRepository.getGameById('g42')).rejects.toEqual(new GameNotFoundError('g42'));
  });
});
