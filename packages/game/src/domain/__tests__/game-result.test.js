import { makeGameResult, makeErrorResult } from '../game-result';
import { buildTestGame } from '../../__tests__/dataBuilders/game';

describe('game result', () => {
  it('can be create a successfull return value', () => {
    // arrange
    const events = [{ some: 'event' }, { some: 'otherEvent' }];
    const game = buildTestGame().build();

    // act
    const result = makeGameResult(game, events);

    // assert
    expect(result).toEqual({
      value: game,
      events,
    });
  });
  it('creates empty events if only a value is provided', () => {
    // act
    const game = buildTestGame().build();
    const result = makeGameResult(game);

    // assert
    expect(result).toEqual({
      value: game,
      events: [],
    });
  });
  it('can create an erroneous result', () => {
    // arrange
    const error = new Error();

    // act
    const result = makeErrorResult(error);

    // assert
    expect(result).toEqual({
      error,
      events: [],
    });
  });
});
