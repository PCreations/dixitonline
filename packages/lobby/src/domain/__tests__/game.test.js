import { makeGame } from '../game';

describe('Game', () => {
  it('can be correctly created', () => {
    expect(makeGame({ id: '1' })).toEqual({ id: '1' });
  });
  it('must have an id', () => {
    expect(() => makeGame({ id: undefined })).toThrow('Game must contain an id');
  });
});
