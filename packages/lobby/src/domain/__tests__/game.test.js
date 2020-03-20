import { makeGame } from '../game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';

describe('Game', () => {
  it('can be correctly created', () => {
    const host = buildTestPlayer().build();
    expect(makeGame({ id: '1', host })).toEqual({ id: '1', host });
  });
  it('must have an id', () => {
    expect(() => makeGame({ id: undefined })).toThrow('Game must contain an id');
  });
  it('must have an host', () => {
    expect(() => makeGame({ id: 'g1' })).toThrow('Game must have an host');
  });
});
