import { buildTestCard } from '../../__tests__/dataBuilders/card';
import { makeHand } from '../hand';

describe('hand', () => {
  it('gets correctly created', () => {
    const cards = [
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
    ];
    expect(makeHand(cards)).toEqual(cards);
  });
  it('cannot gets created empty', () => {
    expect(() => makeHand([])).toThrow('Hand cannot be empty');
  });
  it('cannot gets created with more than 6 cards', () => {
    const cards = [
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
      buildTestCard().build(),
    ];
    expect(() => makeHand(cards)).toThrow('The maximum amount of cards is 6');
  });
});
