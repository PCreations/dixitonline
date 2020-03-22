import { makeResult, makeErrorResult } from '../result';

describe('result', () => {
  it('can be create a successfull return value', () => {
    // arrange
    const events = [{ some: 'event' }, { some: 'otherEvent' }];

    // act
    const result = makeResult('some value', events);

    // assert
    expect(result).toEqual({
      value: 'some value',
      events,
    });
  });
  it('creates empty events if only a value is provided', () => {
    // act
    const result = makeResult('some value');

    // assert
    expect(result).toEqual({
      value: 'some value',
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
    });
  });
});
