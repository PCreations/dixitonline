import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { getAllPlayers } from '../../domain/game';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { makeNullGameRepository } from '../../repos/game-repository';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { makeTestServer } from '../../__tests__/test-server';

describe('quit game', () => {
  test('a player can quite a game in "waiting for players mode"', async () => {
    // arrange
    const host = buildTestPlayer().build();
    const player2 = buildTestPlayer().build();
    const game = buildTestGame()
      .withHost(host)
      .withPlayers([player2])
      .build();
    const gameRepository = makeNullGameRepository({
      gamesData: {
        [game.id]: game,
      },
    });
    const dispatchDomainEvents = jest.fn();
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository,
      }),
      dispatchDomainEvents,
      currentUserId: player2.id,
      currentUserUsername: player2.name,
    });
    const GAME_QUIT_GAME = gql`
      mutation GameQuitGame($quitGameInput: GameQuitGameInput!) {
        gameQuitGame(quitGameInput: $quitGameInput) {
          ... on GameQuitGameResultSuccess {
            game {
              players {
                id
              }
            }
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: GAME_QUIT_GAME,
      variables: { quitGameInput: { gameId: game.id } },
      operationName: 'GameQuitGame',
    });
    const updatedGame = await gameRepository.getGameById(game.id);

    // assert
    expect(response.data.gameQuitGame.game.players).not.toContainEqual({ id: player2.id });
    expect(getAllPlayers(updatedGame)).toEqual([host]);
  });
});
