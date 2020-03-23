import gql from 'graphql-tag';
import { createTestClient } from 'apollo-server-testing';
import { makeTestServer } from '../../__tests__/test-server';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';
import { makeNullGameRepository, GameNotFoundError } from '../../repos';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { newGameStartedEvent } from '../../domain/events';
import { getAllPlayers } from '../../domain/game';

const getStartGameTestServer = ({ currentUserId, currentUserUsername, numberOfPlayers = 3 } = {}) => {
  const game = buildTestGame()
    .withId('g42')
    .withXPlayers(numberOfPlayers)
    .build();
  const initialGames = buildgameRepositoryInitialGames()
    .withGames([game])
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
    currentUserId: currentUserId || game.host.id,
    currentUserUsername: currentUserUsername || game.host.name,
  });

  return {
    game,
    gameRepository,
    dispatchDomainEvents,
    server,
  };
};

describe('start game', () => {
  test('a game with more than 2 players can be started by the host', async () => {
    // arrange
    const { game, gameRepository, dispatchDomainEvents, server } = getStartGameTestServer();
    const GAME_START_GAME = gql`
      mutation GameStartGame($gameStartGameInput: GameStartGameInput!) {
        gameStartGame(gameStartGameInput: $gameStartGameInput) {
          ... on GameStartGameResultSuccess {
            gameId
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: GAME_START_GAME,
      variables: { gameStartGameInput: { gameId: 'g42' } },
      operationName: 'GameStartGame',
    });

    // assert
    expect.assertions(3);
    expect(response).toMatchSnapshot();
    await expect(gameRepository.getGameById('g42')).rejects.toEqual(new GameNotFoundError('g42'));
    expect(dispatchDomainEvents).toHaveBeenCalledWith([
      newGameStartedEvent({ gameId: 'g42', playerIds: getAllPlayers(game).map(({ id }) => id) }),
    ]);
  });
  test("a player can't start a game if she's not the host", async () => {
    // arrange
    const randomPlayer = buildTestPlayer().build();
    const { game, gameRepository, dispatchDomainEvents, server } = getStartGameTestServer({
      currentUserId: randomPlayer.id,
      currentUserUsername: randomPlayer.name,
    });
    const GAME_START_GAME = gql`
      mutation GameStartGame($gameStartGameInput: GameStartGameInput!) {
        gameStartGame(gameStartGameInput: $gameStartGameInput) {
          ... on GameStartGameResultError {
            type
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: GAME_START_GAME,
      variables: { gameStartGameInput: { gameId: 'g42' } },
      operationName: 'GameStartGame',
    });

    // assert
    expect.assertions(3);
    expect(response).toMatchSnapshot();
    expect(dispatchDomainEvents).not.toHaveBeenCalled();
    await expect(gameRepository.getGameById('g42')).resolves.toEqual(game);
  });
  test("a player can't start a game if there is not enough player", async () => {
    // arrange
    const { game, gameRepository, dispatchDomainEvents, server } = getStartGameTestServer({
      numberOfPlayers: 1,
    });
    const GAME_START_GAME = gql`
      mutation GameStartGame($gameStartGameInput: GameStartGameInput!) {
        gameStartGame(gameStartGameInput: $gameStartGameInput) {
          ... on GameStartGameResultError {
            type
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: GAME_START_GAME,
      variables: {
        gameStartGameInput: {
          gameId: 'g42',
        },
      },
      operationName: 'GameStartGame',
    });

    // assert
    expect.assertions(3);
    expect(response).toMatchSnapshot();
    expect(dispatchDomainEvents).not.toHaveBeenCalled();
    await expect(gameRepository.getGameById('g42')).resolves.toEqual(game);
  });
});
