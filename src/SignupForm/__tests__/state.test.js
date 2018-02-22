/*global expect*/
import { inputChange, validateInputs, submitted, reducer, defaultState } from '../state';
import { MISSING_FIELD } from '../model';

describe('sign up form reducer', () => {
  test('should reduce submitted action', () => {
    const actualState = reducer({}, submitted());
    expect(actualState.submitted).toBe(true);
  });
  test('should reduce inputChange action', () => {
    const actualState = reducer({}, inputChange('username', 'foo'));
    expect(actualState.inputs.username).toBe('foo');
  });
  test('should set submitted to false when inputChange action is reduced', () => {
    const actualState = reducer({ submitted: true }, inputChange('username', 'foo'));
    expect(actualState.submitted).toBe(false);
  });
  test('should reduce validateInputs action and set isValid to false if there are errors', () => {
    const state = {
      ...defaultState,
      inputs: {
        username: '',
        email: '',
        password: '',
        passwordConfirmation: '',
      },
      isValid: true,
    };
    const actualState = reducer(state, validateInputs());
    expect(actualState.errors).toEqual({
      username: MISSING_FIELD,
      email: MISSING_FIELD,
      password: MISSING_FIELD,
      passwordConfirmation: MISSING_FIELD,
    });
    expect(actualState.isValid).toBe(false);
  });
  test('should reduce validateInputs action and set isValid to true if there is no error', () => {
    const state = {
      ...defaultState,
      inputs: {
        username: 'foo',
        email: 'foo@example.com',
        password: 'password',
        passwordConfirmation: 'password',
      },
    };
    const actualState = reducer(state, validateInputs());
    expect(actualState.errors).toEqual({});
    expect(actualState.isValid).toBe(true);
  });
  test('should remove error when the erroneous field has changed', () => {
    const state = {
      ...defaultState,
      inputs: {
        username: '',
        email: '',
        password: '',
        passwordConfirmation: '',
      },
    };
    const actualState = reducer(state, validateInputs());
    const stateAfterInputChanged = reducer(actualState, inputChange('username', 'foo'));
    expect(Object.keys(stateAfterInputChanged.errors).indexOf('username')).toBe(-1);
  });
});
