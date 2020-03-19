import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { makeServer } from './test-server';
import { makeNullLobbyRepository } from '../lobby-repository';
import { makeGetDataSources } from '../get-data-sources';
import { makeGetContext } from '../get-context';
import { newGameCreatedEvent } from '../domain-events';

describe('create new game', () => {
  test('it creates a new game', async () => {
    // arrange
    const dispatchDomainEvents = jest.fn();
    const server = makeServer({
      getDataSources: makeGetDataSources({
        lobbyRepository: makeNullLobbyRepository({ nextGameId: 'g1' }),
      }),
      getContext: makeGetContext({ dispatchDomainEvents }),
    });
    const CREATE_GAME = gql`
      mutation CreateGame {
        createGame {
          game {
            id
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);

    // assert
    const response = await mutate({ mutation: CREATE_GAME });
    expect(response).toMatchSnapshot();
    expect(dispatchDomainEvents).toHaveBeenCalledWith([newGameCreatedEvent({ gameId: 'g1' })]);
  });
});
