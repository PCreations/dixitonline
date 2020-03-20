import { makePlayer } from '../player';

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
});
