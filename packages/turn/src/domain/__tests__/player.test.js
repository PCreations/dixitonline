import { makePlayer } from '../player';
import { buildTestHand } from '../../__tests__/dataBuilders/hand';

describe('player', () => {
  it('gets correctly created', () => {
    const hand = buildTestHand().build();
    expect(
      makePlayer({
        id: 'p1',
        name: 'player1',
        hand,
      })
    ).toEqual({
      id: 'p1',
      name: 'player1',
      hand,
    });
  });
});
