/*global expect*/
import mergeAppliedFns from '../mergeAppliedFns';

describe('mergeAppliedFns', () => {
  test('should merge the result of the given functions applied to the given object', () => {
    const initial = {
      foo: 'bar',
      baz: 42,
    };
    const expected = {
      foo: 'BAR',
      bazBis: 42,
      bar: 'foobar',
    };
    expect(mergeAppliedFns([
      obj => ({
        foo: 'BAR'
      }),
      obj => ({
        bazBis: 42,
        bar: 'foobar',
      }),
    ])(initial)).toEqual(expected);
  });
});