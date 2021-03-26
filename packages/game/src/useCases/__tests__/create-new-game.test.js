import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { makeNullGameRepository } from '../../repos/game-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { newGameCreatedEvent } from '../../domain/events';

describe('create new game', () => {
  it('creates a new game', async () => {
    // arrange
    const dispatchDomainEvents = jest.fn();
    const gameRepository = makeNullGameRepository({ nextGameId: 'g1' });
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository,
      }),
      dispatchDomainEvents,
      currentUserId: 'p1',
      currentUserUsername: 'player1',
    });
    const GAME_CREATE_GAME = gql`
      mutation GameCreateGame {
        gameCreateGame {
          game {
            id
            host {
              id
              name
            }
            endCondition {
              ... on GameRemainingTurnsEndCondition {
                remainingTurns
              }
            }
          }
        }
      }
    `;
    const host = buildTestPlayer()
      .withId('p1')
      .withName('player1')
      .build();
    const expectedGame = buildTestGame()
      .withId('g1')
      .withHost(host)
      .build();

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({ mutation: GAME_CREATE_GAME });

    // assert
    expect(response).toMatchSnapshot();
    const createdGame = await gameRepository.getGameById('g1');
    expect(createdGame).toEqual(expectedGame);
    expect(dispatchDomainEvents).toHaveBeenCalledWith([newGameCreatedEvent({ gameId: 'g1' })]);
  });
  it('creates a new game with x times being storyteller as end condition', async () => {
    // arrange
    const dispatchDomainEvents = jest.fn();
    const gameRepository = makeNullGameRepository({ nextGameId: 'g1' });
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository,
      }),
      dispatchDomainEvents,
      currentUserId: 'p1',
      currentUserUsername: 'player1',
    });
    const GAME_CREATE_GAME = gql`
      mutation GameCreateGame(
        $createGameWithXtimesStorytellerEndingConditionInput: GameCreateGameWithXtimesStorytellerEndingConditionInput!
      ) {
        gameCreateGameWithXtimesStorytellerEndingCondition(
          createGameWithXtimesStorytellerEndingConditionInput: $createGameWithXtimesStorytellerEndingConditionInput
        ) {
          ... on GameCreateGameWithXtimesStorytellerEndingConditionResultSuccess {
            game {
              id
              host {
                id
                name
              }
              endCondition {
                ... on GameRemainingTurnsEndCondition {
                  remainingTurns
                }
              }
            }
          }
        }
      }
    `;
    const host = buildTestPlayer()
      .withId('p1')
      .withName('player1')
      .build();
    const expectedGame = buildTestGame()
      .withId('g1')
      .withHost(host)
      .withXtimesStorytellerLimit(4)
      .build();

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: GAME_CREATE_GAME,
      variables: {
        createGameWithXtimesStorytellerEndingConditionInput: {
          timesBeingStoryteller: 4,
        },
      },
    });

    // assert
    expect(response).toMatchSnapshot();
    const createdGame = await gameRepository.getGameById('g1');
    expect(createdGame).toEqual(expectedGame);
    expect(dispatchDomainEvents).toHaveBeenCalledWith([newGameCreatedEvent({ gameId: 'g1' })]);
  });
  it("can't create a new game with x times being storyteller set as number < 1", async () => {
    // arrange
    const dispatchDomainEvents = jest.fn();
    const gameRepository = makeNullGameRepository({ nextGameId: 'g1' });
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository,
      }),
      dispatchDomainEvents,
      currentUserId: 'p1',
      currentUserUsername: 'player1',
    });
    const GAME_CREATE_GAME = gql`
      mutation GameCreateGame(
        $createGameWithXtimesStorytellerEndingConditionInput: GameCreateGameWithXtimesStorytellerEndingConditionInput!
      ) {
        gameCreateGameWithXtimesStorytellerEndingCondition(
          createGameWithXtimesStorytellerEndingConditionInput: $createGameWithXtimesStorytellerEndingConditionInput
        ) {
          ... on GameCreateGameWithXtimesStorytellerEndingConditionResultError {
            type
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: GAME_CREATE_GAME,
      variables: {
        createGameWithXtimesStorytellerEndingConditionInput: {
          timesBeingStoryteller: 0,
        },
      },
    });

    // assert
    expect(response).toMatchSnapshot();
    expect(dispatchDomainEvents).not.toHaveBeenCalled();
  });
  it('creates a new game with score limit as end condition', async () => {
    // arrange
    const now = new Date();
    const dispatchDomainEvents = jest.fn();
    const gameRepository = makeNullGameRepository({ nextGameId: 'g1' });
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository,
      }),
      dispatchDomainEvents,
      currentUserId: 'p1',
      currentUserUsername: 'player1',
      getNowDate: () => now,
    });
    const GAME_CREATE_GAME = gql`
      mutation GameCreateGame(
        $createGameWithScoreLimitEndingConditionInput: GameCreateGameWithScoreLimitEndingConditionInput!
      ) {
        gameCreateGameWithScoreLimitEndingCondition(
          createGameWithScoreLimitEndingConditionInput: $createGameWithScoreLimitEndingConditionInput
        ) {
          ... on GameCreateGameWithScoreLimitEndingConditionResultSuccess {
            game {
              id
              host {
                id
                name
              }
              endCondition {
                ... on GameScoreLimitEndCondition {
                  scoreLimit
                }
              }
            }
          }
        }
      }
    `;
    const host = buildTestPlayer()
      .withId('p1')
      .withName('player1')
      .joinedAt(now)
      .build();
    const expectedGame = buildTestGame()
      .withId('g1')
      .withHost(host)
      .withScoreLimit(30)
      .build();

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: GAME_CREATE_GAME,
      variables: {
        createGameWithScoreLimitEndingConditionInput: {
          scoreLimit: 30,
        },
      },
    });

    // assert
    expect(response).toMatchSnapshot();
    const createdGame = await gameRepository.getGameById('g1');
    expect(createdGame).toEqual(expectedGame);
    expect(dispatchDomainEvents).toHaveBeenCalledWith([newGameCreatedEvent({ gameId: 'g1' })]);
  });
  it("can't create a new game with score limit set as number < 1", async () => {
    // arrange
    const dispatchDomainEvents = jest.fn();
    const gameRepository = makeNullGameRepository({ nextGameId: 'g1' });
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository,
      }),
      dispatchDomainEvents,
      currentUserId: 'p1',
      currentUserUsername: 'player1',
    });
    const GAME_CREATE_GAME = gql`
      mutation GameCreateGame(
        $createGameWithScoreLimitEndingConditionInput: GameCreateGameWithScoreLimitEndingConditionInput!
      ) {
        gameCreateGameWithScoreLimitEndingCondition(
          createGameWithScoreLimitEndingConditionInput: $createGameWithScoreLimitEndingConditionInput
        ) {
          ... on GameCreateGameWithScoreLimitEndingConditionResultError {
            type
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({
      mutation: GAME_CREATE_GAME,
      variables: {
        createGameWithScoreLimitEndingConditionInput: {
          scoreLimit: -1,
        },
      },
    });

    // assert
    expect(response).toMatchSnapshot();
    expect(dispatchDomainEvents).not.toHaveBeenCalled();
  });
});
