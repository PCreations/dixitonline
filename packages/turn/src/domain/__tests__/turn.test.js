import { TurnPhase, makeTurn } from '../turn';

describe('turn', () => {
  it('can be correctly created', () => {
    expect(makeTurn({ id: 't1' })).toEqual({
      id: 't1',
      phase: TurnPhase.STORYTELLER,
    });
  });
});
