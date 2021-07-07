import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { makeTestServer } from '../../__tests__/test-server';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { makeNullGameRepository } from '../../repos/game-repository';
import { makeGetDataSources } from '../../infra/graphql/get-data-sources';
import { newGameCreatedEvent } from '../../domain/events';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';

describe('play now', () => {
  it('creates a new game if there is no public games waiting for players', async () => {
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
    const GAME_PLAY_NOW = gql`
      mutation GamePlayNow {
        gamePlayNow {
          game {
            id
            isPrivate
            host {
              id
              name
            }
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({ mutation: GAME_PLAY_NOW });

    // assert
    expect(response.data.gamePlayNow.game).toEqual({
      id: 'g1',
      isPrivate: false,
      host: {
        id: 'p1',
        name: 'player1',
      },
    });
    expect(dispatchDomainEvents).toHaveBeenCalledWith([newGameCreatedEvent({ gameId: 'g1' })]);
  });

  it('creates a new game if there is only public games waiting for players where the current player are already in', async () => {
    // arrange
    const dispatchDomainEvents = jest.fn();
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([
        buildTestGame()
          .withHost(
            buildTestPlayer()
              .withId('p1')
              .withName('player1')
              .build()
          )
          .withId('3-players-game')
          .asPublic()
          .withXPlayers(3)
          .build(),
        buildTestGame()
          .withId('private-game')
          .withXPlayers(5)
          .build(),
      ])
      .build();
    const gameRepository = makeNullGameRepository({ nextGameId: 'g1', gamesData: initialGames });
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository,
      }),
      dispatchDomainEvents,
      currentUserId: 'p1',
      currentUserUsername: 'player1',
    });
    const GAME_PLAY_NOW = gql`
      mutation GamePlayNow {
        gamePlayNow {
          game {
            id
            isPrivate
            host {
              id
              name
            }
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({ mutation: GAME_PLAY_NOW });

    // assert
    expect(response.data.gamePlayNow.game).toEqual({
      id: 'g1',
      isPrivate: false,
      host: {
        id: 'p1',
        name: 'player1',
      },
    });
    expect(dispatchDomainEvents).toHaveBeenCalledWith([newGameCreatedEvent({ gameId: 'g1' })]);
  });

  it('creates a new game if there is only public games waiting for players where the maximum number of players is reached', async () => {
    // arrange
    const dispatchDomainEvents = jest.fn();
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([
        buildTestGame()
          .asFullGame()
          .asPublic()
          .build(),
        buildTestGame()
          .withId('private-game')
          .withXPlayers(5)
          .build(),
      ])
      .build();
    const gameRepository = makeNullGameRepository({ nextGameId: 'g1', gamesData: initialGames });
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository,
      }),
      dispatchDomainEvents,
      currentUserId: 'p1',
      currentUserUsername: 'player1',
    });
    const GAME_PLAY_NOW = gql`
      mutation GamePlayNow {
        gamePlayNow {
          game {
            id
            isPrivate
            host {
              id
              name
            }
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({ mutation: GAME_PLAY_NOW });

    // assert
    expect(response.data.gamePlayNow.game).toEqual({
      id: 'g1',
      isPrivate: false,
      host: {
        id: 'p1',
        name: 'player1',
      },
    });
    expect(dispatchDomainEvents).toHaveBeenCalledWith([newGameCreatedEvent({ gameId: 'g1' })]);
  });

  it('joins the player to the game waiting for players that has the most players', async () => {
    // arrange
    const dispatchDomainEvents = jest.fn();
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([
        buildTestGame()
          .withId('2-players-game')
          .asPublic()
          .withXPlayers(2)
          .build(),
        buildTestGame()
          .withId('1-player-game')
          .asPublic()
          .withXPlayers(1)
          .build(),
        buildTestGame()
          .withId('3-players-game')
          .asPublic()
          .withXPlayers(3)
          .build(),
        buildTestGame()
          .withId('private-game')
          .withXPlayers(5)
          .build(),
      ])
      .build();
    const gameRepository = makeNullGameRepository({ gamesData: initialGames });
    const server = makeTestServer({
      getDataSources: makeGetDataSources({
        gameRepository,
      }),
      dispatchDomainEvents,
      currentUserId: 'p1',
      currentUserUsername: 'player1',
    });
    const GAME_PLAY_NOW = gql`
      mutation GamePlayNow {
        gamePlayNow {
          game {
            id
            isPrivate
          }
        }
      }
    `;

    // act
    const { mutate } = createTestClient(server);
    const response = await mutate({ mutation: GAME_PLAY_NOW });

    // assert
    expect(response.data.gamePlayNow.game).toEqual({
      id: '3-players-game',
      isPrivate: false,
    });
  });
});
