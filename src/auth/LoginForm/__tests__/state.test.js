/*global expect*/
import { inputChange, validateInputs, submitted, reducer, defaultState } from '../state';
import { MISSING_FIELD } from '../../model';

describe('login form reducer', () => {
  test('should reduce submitted action', () => {
    const actualState = reducer({}, submitted());
    expect(actualState.submitted).toBe(true);
  });
  test('should reduce inputChange action', () => {
    const actualState = reducer({}, inputChange('email', 'foo@example.com'));
    expect(actualState.inputs.email).toBe('foo@example.com');
  });
  test('should set submitted to false when inputChange action is reduced', () => {
    const actualState = reducer({ submitted: true }, inputChange('email', 'foo@example.com'));
    expect(actualState.submitted).toBe(false);
  });
  test('should reduce validateInputs action and set isValid to false if there are errors', () => {
    const state = {
      ...defaultState,
      inputs: {
        email: '',
        password: '',
      },
      isValid: true,
    };
    const actualState = reducer(state, validateInputs());
    expect(actualState.errors).toEqual({
      email: MISSING_FIELD,
      password: MISSING_FIELD,
    });
    expect(actualState.isValid).toBe(false);
  });
  test('should reduce validateInputs action and set isValid to true if there is no error', () => {
    const state = {
      ...defaultState,
      inputs: {
        email: 'foo@example.com',
        password: 'password',
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
        email: '',
        password: '',
      },
    };
    const actualState = reducer(state, validateInputs());
    const stateAfterInputChanged = reducer(actualState, inputChange('email', 'foo@example.com'));
    expect(Object.keys(stateAfterInputChanged.errors).indexOf('email')).toBe(-1);
  });
});
