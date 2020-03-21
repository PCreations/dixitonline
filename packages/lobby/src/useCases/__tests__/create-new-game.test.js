import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { makeTestServer } from '../../__tests__/test-server';
import { makeNullLobbyRepository } from '../../repos/lobby-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { newGameCreatedEvent } from '../../domain/events';

describe('create new game', () => {
  it('creates a new game', async () => {
    // arrange
    const dispatchDomainEvents = jest.fn();
    const lobbyRepository = makeNullLobbyRepository({ nextGameId: 'g1' });
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        lobbyRepository,
      }),
      dispatchDomainEvents,
      currentUserId: 'p1',
      currentUserUsername: 'player1',
    });
    const LOBBY_CREATE_GAME = gql`
      mutation LobbyCreateGame {
        lobbyCreateGame {
          game {
            id
            host {
              id
              name
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
    const response = await mutate({ mutation: LOBBY_CREATE_GAME });

    // assert
    const createdGame = await lobbyRepository.getGameById('g1');
    expect(response).toMatchSnapshot();
    expect(createdGame).toEqual(expectedGame);
    expect(dispatchDomainEvents).toHaveBeenCalledWith([newGameCreatedEvent({ gameId: 'g1' })]);
  });
});
