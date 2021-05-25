import gql from 'graphql-tag';
import { createTestClient } from 'apollo-server-testing';
import { makeTestServer } from '../../__tests__/test-server';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';
import { makeNullGameRepository } from '../../repos';
import { newGameStartedEvent } from '../../domain/events';
import { getAllPlayers } from '../../domain/game';
import { buildTestCard } from '../../../../turn/src/__tests__/dataBuilders/card';

const getStartGameTestServer = ({ currentUserId, currentUserUsername, numberOfPlayers = 3 } = {}) => {
  const game = buildTestGame()
    .withId('g42')
    .withXPlayers(numberOfPlayers)
    .withScoreLimit(25);
  const endedGame = buildTestGame({ ...game.build() })
    .withScore([12, 5, 27])
    .withCurrentTurnNumber(10)
    .withCurrentTurnId(42)
    .withDrawPile([buildTestCard().build(), buildTestCard().build(), buildTestCard().build()])
    .withEndedStatus()
    .build();
  const expectedRestartedGame = buildTestGame({ ...game.build() })
    .withStartedStatus()
    .build();
  const initialGames = buildgameRepositoryInitialGames()
    .withGames([endedGame])
    .build();
  const gameRepository = makeNullGameRepository({
    gamesData: initialGames,
  });
  const dispatchDomainEvents = jest.fn();
  const server = makeTestServer({
    getDataSources: makeGetDataSources({
      gameRepository,
    }),
    dispatchDomainEvents,
    currentUserId: currentUserId || endedGame.host.id,
    currentUserUsername: currentUserUsername || endedGame.host.name,
  });

  return {
    endedGame,
    expectedRestartedGame,
    gameRepository,
    dispatchDomainEvents,
    server,
  };
};

describe('restart game', () => {
  test('an ended game can be restarted', async () => {
    // arrange
    const { endedGame, expectedRestartedGame, gameRepository, dispatchDomainEvents, server } = getStartGameTestServer();
    const GAME_START_GAME = gql`
      mutation GameStartGame($startGameInput: GameStartGameInput!) {
        gameStartGame(startGameInput: $startGameInput) {
          ... on GameStartGameResultSuccess {
            game {
              id
            }
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: GAME_START_GAME,
      variables: { startGameInput: { gameId: 'g42' } },
      operationName: 'GameStartGame',
    });

    // assert
    expect.assertions(3);
    expect(response).toMatchSnapshot();
    const editedGame = await gameRepository.getGameById('g42');
    expect(editedGame).toEqual(expectedRestartedGame);
    expect(dispatchDomainEvents).toHaveBeenCalledWith([
      newGameStartedEvent({
        gameId: 'g42',
        playerIds: getAllPlayers(endedGame).map(({ id }) => id),
        useAllDeck: true,
      }),
    ]);
  });
});
