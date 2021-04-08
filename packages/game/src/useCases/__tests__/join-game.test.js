import gql from 'graphql-tag';
import { createTestClient } from 'apollo-server-testing';
import { makeNullGameRepository } from '../../repos/game-repository';
import { makeTestServer } from '../../__tests__/test-server';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { playerJoinedGame } from '../../domain/events';

const getJoinGameTestServer = ({
  currentUserId = 'p2',
  currentUserUsername = 'player2',
  maxOutPlayers = false,
  getNowDate = () => new Date(),
} = {}) => {
  const host = buildTestPlayer()
    .withId('p1')
    .withName('player1')
    .joinedAt(getNowDate())
    .build();
  let gameToBeBuilt = buildTestGame()
    .withId('g1')
    .withHost(host);
  if (maxOutPlayers) {
    gameToBeBuilt = gameToBeBuilt.asFullGame();
  }
  const game = gameToBeBuilt.build();
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
    currentUserId,
    currentUserUsername,
    getNowDate,
  });

  return {
    game,
    dispatchDomainEvents,
    gameRepository,
    server,
  };
};

describe('join game', () => {
  test('a player can join a game', async () => {
    // arrange
    const getNowDate = () => new Date('2021-04-04');
    const { game, dispatchDomainEvents, gameRepository, server } = getJoinGameTestServer({ getNowDate });
    const expectedUpdatedGame = buildTestGame(game)
      .withPlayers([
        buildTestPlayer()
          .withId('p2')
          .withName('player2')
          .build(),
      ])
      .build();
    const GAME_JOIN_GAME = gql`
      mutation GameJoinGame($joinGameInput: GameJoinGameInput!) {
        gameJoinGame(joinGameInput: $joinGameInput) {
          ... on GameJoinGameResultSuccess {
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
    await mutate({
      mutation: GAME_JOIN_GAME,
      variables: { joinGameInput: { gameId: 'g1' } },
      operationName: 'GameJoinGame',
    });
    const updatedGame = await gameRepository.getGameById('g1');
    const playerHeartbeat = await gameRepository.getPlayerHeartbeat({ playerId: 'p2', gameId: 'g1' });
    // assert

    // TODO : change this when https://github.com/facebook/jest/pull/9575 is released
    expect({ ...updatedGame }).toEqual({ ...expectedUpdatedGame });
    expect(playerHeartbeat.heartbeat).toEqual(getNowDate());
    expect(dispatchDomainEvents).toHaveBeenCalledWith([playerJoinedGame({ gameId: 'g1', playerId: 'p2' })]);
  });
  test("a player can't join a game she has already joined", async () => {
    // arrange
    const { game, dispatchDomainEvents, gameRepository, server } = getJoinGameTestServer({
      currentUserUsername: 'player1',
      currentUserId: 'p1',
    });
    const GAME_JOIN_GAME = gql`
      mutation GameCreateGame($joinGameInput: GameJoinGameInput!) {
        gameJoinGame(joinGameInput: $joinGameInput) {
          ... on GameJoinGameResultError {
            type
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: GAME_JOIN_GAME,
      variables: {
        joinGameInput: { gameId: 'g1' },
      },
      operationName: 'GameCreateGame',
    });
    const updatedGame = await gameRepository.getGameById('g1');

    // assert
    expect(response).toMatchSnapshot();
    // TODO : change this when https://github.com/facebook/jest/pull/9575 is released
    expect({ ...updatedGame }).toEqual({
      ...game,
    });
    expect(dispatchDomainEvents).not.toHaveBeenCalled();
  });
  test("a player can't join a game with already the maximum number of player", async () => {
    // arrange
    const { game, dispatchDomainEvents, gameRepository, server } = getJoinGameTestServer({ maxOutPlayers: true });
    const GAME_JOIN_GAME = gql`
      mutation GameCreateGame($joinGameInput: GameJoinGameInput!) {
        gameJoinGame(joinGameInput: $joinGameInput) {
          ... on GameJoinGameResultError {
            type
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: GAME_JOIN_GAME,
      variables: {
        joinGameInput: { gameId: 'g1' },
      },
      operationName: 'GameCreateGame',
    });
    const updatedGame = await gameRepository.getGameById('g1');

    // assert
    expect(response).toMatchSnapshot();
    // TODO : change this when https://github.com/facebook/jest/pull/9575 is released
    expect({ ...updatedGame }).toEqual({
      ...game,
    });
    expect(dispatchDomainEvents).not.toHaveBeenCalled();
  });
  test.todo("a player can't join an already started game");
});
