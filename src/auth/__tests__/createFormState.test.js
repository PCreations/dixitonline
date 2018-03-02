/*global expect*/
import createFormState, { EMAIL_INPUT, USERNAME_INPUT } from '../createFormState';
import { MISSING_FIELD, validateRequiredFields, applyValidators } from '../model';

const {
  reducer,
  defaultState,
  getInputs,
  getErrors,
  inputChange,
  validateInputs,
  submitted,
} = createFormState({
  getFormFieldErrors: applyValidators([validateRequiredFields([EMAIL_INPUT, USERNAME_INPUT])]),
  inputs: [EMAIL_INPUT, USERNAME_INPUT],
});

describe('reducer', () => {
  test('should reduce submitted action', () => {
    const actualState = reducer({}, submitted());
    expect(actualState.submitted).toBe(true);
  });
  test('should reduce inputChange action', () => {
    const actualState = reducer({}, inputChange(EMAIL_INPUT, 'foo@example.com'));
    expect(actualState.inputs[EMAIL_INPUT]).toBe('foo@example.com');
  });
  test('should set submitted to false when inputChange action is reduced', () => {
    const actualState = reducer({ submitted: true }, inputChange(EMAIL_INPUT, 'foo@example.com'));
    expect(actualState.submitted).toBe(false);
  });
  test('should reduce validateInputs action and set isValid to false if there are errors', () => {
    const state = {
      ...defaultState,
      inputs: {
        [EMAIL_INPUT]: '',
        [USERNAME_INPUT]: '',
      },
      isValid: true,
    };
    const actualState = reducer(state, validateInputs());
    expect(actualState.errors).toEqual({
      [EMAIL_INPUT]: MISSING_FIELD,
      [USERNAME_INPUT]: MISSING_FIELD,
    });
    expect(actualState.isValid).toBe(false);
  });
  test('should reduce validateInputs action and set isValid to true if there is no error', () => {
    const state = {
      ...defaultState,
      inputs: {
        [EMAIL_INPUT]: 'foo@example.com',
        [USERNAME_INPUT]: 'foobar',
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
        [EMAIL_INPUT]: '',
        [USERNAME_INPUT]: '',
      },
    };
    const actualState = reducer(state, validateInputs());
    const stateAfterInputChanged = reducer(actualState, inputChange(EMAIL_INPUT, 'foo@example.com'));
    expect(Object.keys(stateAfterInputChanged.errors).indexOf(EMAIL_INPUT)).toBe(-1);
  });
});

describe('selectors', () => {
  test('getInputs should return inputs slice', () => {
    expect(getInputs(defaultState)).toEqual({
      [EMAIL_INPUT]: '',
      [USERNAME_INPUT]: '',
    });
  });
  test('getErrors should return errors slice', () => {
    expect(getErrors(defaultState)).toEqual({
      [EMAIL_INPUT]: null,
      [USERNAME_INPUT]: null,
    });
  });
});
