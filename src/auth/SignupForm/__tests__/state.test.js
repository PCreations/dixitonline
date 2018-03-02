/*global expect*/
import { defaultState, getInputs, getErrors } from '../state';

describe('sign up form default state', () => {
  test('should have the correct inputs', () => {
    expect(getInputs(defaultState)).toEqual({
      username: '',
      email: '',
      password: '',
      passwordConfirmation: '',
    });
  });
  test('should have no error', () => {
    expect(getErrors(defaultState)).toEqual({
      username: null,
      email: null,
      password: null,
      passwordConfirmation: null,
    });
  });
});
