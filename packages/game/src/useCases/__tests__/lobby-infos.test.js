import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { makeNullGameRepository } from '../../repos/game-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';

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

  test('sets the heartbeat to current date for the player requesting the game info', async () => {
    // arrange
    const now = new Date('2021-04-06');
    const host = buildTestPlayer()
      .withId('p1')
      .build();
    const players = [
      buildTestPlayer()
        .withId('p2')
        .build(),
      buildTestPlayer()
        .withId('p3')
        .build(),
      buildTestPlayer()
        .withId('p4')
        .build(),
      buildTestPlayer()
        .withId('p5')
        .build(),
    ];
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([
        buildTestGame()
          .withId('g1')
          .withCards(54)
          .withHost(host)
          .withCurrentTurnId('t1')
          .withPlayers(players)
          .withScore([2, 4, 6, 9, 3])
          .build(),
      ])
      .build();
    const gameRepository = makeNullGameRepository({
      nextGameId: 'g2',
      gamesData: initialGames,
    });
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository,
      }),
      currentUserId: 'p1',
      currentUserUsername: 'player1',
      getNowDate: () => now,
    });
    const GET_GAME = gql`
      query GetGame($gameId: ID!) {
        game(gameId: $gameId) {
          id
        }
      }
    `;

    // act
    const { query } = createTestClient(server);
    await query({
      query: GET_GAME,
      variables: { gameId: 'g1' },
      operationName: 'GetGame',
    });
    const playerHeartbeat = await gameRepository.getPlayerHeartbeat({
      playerId: 'p1',
      gameId: 'g1',
    });

    // assert
    expect(playerHeartbeat.heartbeat).toEqual(now);
  });
});
