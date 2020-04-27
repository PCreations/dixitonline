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
      mutation GameCreateGame($createGameWithEndingConditionInput: GameCreateGameWithEndingConditionInput!) {
        gameCreateGameWithEndingCondition(createGameWithEndingConditionInput: $createGameWithEndingConditionInput) {
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
    const response = await mutate({
      mutation: GAME_CREATE_GAME,
      variables: {
        createGameWithEndingConditionInput: {
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
});
