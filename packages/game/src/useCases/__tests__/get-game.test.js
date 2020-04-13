import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { makeNullGameRepository } from '../../repos/game-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';

describe('getGame', () => {
  test('gets a game by its id', async () => {
    // arrange
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
          remainingTurns
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
