import { makePlayer, equals } from '../player';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';

describe('Player', () => {
  it('can be correctly created', () => {
    expect(makePlayer({ id: 'p1', name: 'player1' })).toEqual({ id: 'p1', name: 'player1' });
  });
  it('must have an id', () => {
    expect(() => makePlayer({ name: 'player1' })).toThrow('Player must contain an id');
  });
  it('must have a non empty name', () => {
    expect(() => makePlayer({ id: 'p1' })).toThrow('Player must have a name');
  });
  it('is equal to other player if same id', () => {
    const p1 = buildTestPlayer()
      .withId('p1')
      .build();
    const p2 = buildTestPlayer()
      .withId('p1')
      .build();
    expect(equals(p1, p2)).toBe(true);
  });
});
