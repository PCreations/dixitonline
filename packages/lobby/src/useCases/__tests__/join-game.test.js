import gql from 'graphql-tag';
import { createTestClient } from 'apollo-server-testing';
import { makeNullLobbyRepository } from '../../repos/lobby-repository';
import { makeTestServer } from '../../__tests__/test-server';
import { buildLobbyRepositoryInitialGames } from '../../__tests__/dataBuilders/lobby-repository-initial-games';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { playerJoinedGame } from '../../domain/events';

describe('join game', () => {
  test('a player can join a game', async () => {
    // arrange
    const host = buildTestPlayer()
      .withId('p1')
      .withName('player1')
      .build();
    const game = buildTestGame()
      .withId('g1')
      .withHost(host)
      .build();
    const expectedUpdatedGame = buildTestGame(game)
      .withPlayers([
        buildTestPlayer()
          .withId('p2')
          .withName('player2')
          .build(),
      ])
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
      currentUserId: 'p2',
      currentUserUsername: 'player2',
    });
    const LOBBY_JOIN_GAME = gql`
      mutation LobbyCreateGame($lobbyJoinGameInput: LobbyJoinGameInput!) {
        lobbyJoinGame(lobbyJoinGameInput: $lobbyJoinGameInput) {
          ... on LobbyJoinGameResultSuccess {
            game {
              id
              host {
                id
                name
              }
              players {
                id
                name
              }
            }
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: LOBBY_JOIN_GAME,
      variables: { lobbyJoinGameInput: { gameId: 'g1' } },
      operationName: 'LobbyCreateGame',
    });
    const updatedGame = await lobbyRepository.getGameById('g1');

    // assert
    expect(response).toMatchSnapshot();
    // TODO : change this when https://github.com/facebook/jest/pull/9575 is released
    expect({ ...updatedGame }).toEqual({ ...expectedUpdatedGame });
    expect(dispatchDomainEvents).toHaveBeenCalledWith([playerJoinedGame({ gameId: 'g1', playerId: 'p2' })]);
  });
  test("a player can't join a game she has already joined", async () => {
    // arrange
    const host = buildTestPlayer()
      .withId('p1')
      .withName('player1')
      .build();
    const game = buildTestGame()
      .withId('g1')
      .withHost(host)
      .withPlayers([
        buildTestPlayer()
          .withId('p2')
          .withName('player2')
          .build(),
      ])
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
      currentUserId: 'p2',
      currentUserUsername: 'player2',
    });
    const LOBBY_JOIN_GAME = gql`
      mutation LobbyCreateGame($lobbyJoinGameInput: LobbyJoinGameInput!) {
        lobbyJoinGame(lobbyJoinGameInput: $lobbyJoinGameInput) {
          ... on LobbyJoinGameResultError {
            type
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: LOBBY_JOIN_GAME,
      variables: {
        lobbyJoinGameInput: { gameId: 'g1' },
      },
      operationName: 'LobbyCreateGame',
    });
    const updatedGame = await lobbyRepository.getGameById('g1');

    // assert
    expect(response).toMatchSnapshot();
    // TODO : change this when https://github.com/facebook/jest/pull/9575 is released
    expect({ ...updatedGame }).toEqual({
      ...game,
    });
    expect(dispatchDomainEvents).not.toHaveBeenCalled();
  });
});
