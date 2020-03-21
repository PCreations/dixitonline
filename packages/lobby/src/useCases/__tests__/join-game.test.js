import gql from 'graphql-tag';
import { createTestClient } from 'apollo-server-testing';
import { makeNullLobbyRepository } from '../../repos/lobby-repository';
import { makeTestServer } from '../../__tests__/test-server';
import { buildLobbyRepositoryInitialGames } from '../../__tests__/dataBuilders/lobby-repository-initial-games';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';

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
    const intialGames = buildLobbyRepositoryInitialGames()
      .withGames([game])
      .build();

    const lobbyRepository = makeNullLobbyRepository({ intialGames });
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
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: LOBBY_JOIN_GAME,
      variables: { lobbyJoinGameInput: { gameId: 'g1' } },
      operationName: 'LobbyCreateGame',
    });

    // assert
    expect(response).toMatchSnapshot();
    expect(dispatchDomainEvents).toHaveBeenCalledWith([
      { type: '[lobby] - a new player has joined a game', payload: { playerId: 'p2', gameId: 'g1' } },
    ]);
  });
});
