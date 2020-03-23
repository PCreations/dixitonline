import { newGameCreatedEvent, playerJoinedGame, newGameStartedEvent } from '../events';

describe('lobby domain events', () => {
  test('newGameCreated event', () => {
    expect(newGameCreatedEvent({ gameId: 'g1' })).toEqual({
      type: '[lobby] - a new game has been created',
      payload: {
        gameId: 'g1',
      },
    });
  });
  test('playerJoinedGame event', () => {
    expect(playerJoinedGame({ gameId: 'g1', playerId: 'p1' })).toEqual({
      type: '[lobby] - a new player has joined a game',
      payload: {
        gameId: 'g1',
        playerId: 'p1',
      },
    });
  });
  test('newGameStarted event', () => {
    expect(newGameStartedEvent({ gameId: 'g1', playerIds: ['p1', 'p2', 'p3'] })).toEqual({
      type: '[lobby] - a new game has started',
      payload: { gameId: 'g1', playerIds: ['p1', 'p2', 'p3'] },
    });
  });
});
