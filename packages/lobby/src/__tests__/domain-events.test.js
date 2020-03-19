import { newGameCreatedEvent } from '../domain-events';

describe('lobby domain events', () => {
  test('newGameCreated event', () => {
    expect(newGameCreatedEvent({ gameId: 'g1' })).toEqual({
      type: '[lobby] - a new game has been created',
      payload: {
        gameId: 'g1',
      },
    });
  });
});
