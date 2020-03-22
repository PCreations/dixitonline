import gql from 'graphql-tag';
import { createTestClient } from 'apollo-server-testing';
import { makeTestServer } from '../../__tests__/test-server';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildLobbyRepositoryInitialGames } from '../../__tests__/dataBuilders/lobby-repository-initial-games';
import { makeNullLobbyRepository, GameNotFoundError } from '../../repos';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { newGameStartedEvent } from '../../domain/events';

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
          ... on LobbyStartGameResultSuccess {
            gameId
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: LOBBY_START_GAME,
      variables: { lobbyStartGameInput: { gameId: 'g42' } },
      operationName: 'LobbyStartGame',
    });

    // assert
    expect.assertions(3);
    expect(response).toMatchSnapshot();
    await expect(lobbyRepository.getGameById('g42')).rejects.toEqual(new GameNotFoundError('g42'));
    expect(dispatchDomainEvents).toHaveBeenCalledWith([
      newGameStartedEvent({ gameId: 'g42', playerIds: [game.host.id, ...game.players.map(({ id }) => id)] }),
    ]);
  });
  test("a player can't start a game if she's not the host", async () => {
    // arrange
    const game = buildTestGame()
      .withId('g42')
      .withXPlayers(3)
      .build();
    const randomPlayer = buildTestPlayer().build();
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
      currentUserId: randomPlayer.id,
      currentUserUsername: randomPlayer.name,
    });
    const LOBBY_START_GAME = gql`
      mutation LobbyStartGame($lobbyStartGameInput: LobbyStartGameInput!) {
        lobbyStartGame(lobbyStartGameInput: $lobbyStartGameInput) {
          ... on LobbyStartGameResultError {
            type
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: LOBBY_START_GAME,
      variables: { lobbyStartGameInput: { gameId: 'g42' } },
      operationName: 'LobbyStartGame',
    });

    // assert
    expect.assertions(2);
    expect(response).toMatchSnapshot();
    await expect(lobbyRepository.getGameById('g42')).resolves.toEqual(game);
  });
});
