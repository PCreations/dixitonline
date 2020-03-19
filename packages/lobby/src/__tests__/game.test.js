import { makeGame } from '../game';

describe('Game', () => {
  it('must have an id', () => {
    expect(() => makeGame({ id: undefined })).toThrow('Game must contain an id');
  });
  it('can be correctly created', () => {
    expect(makeGame({ id: '1' })).toEqual({ id: '1' });
  });
});
