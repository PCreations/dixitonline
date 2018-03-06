import { createActions, handleActions } from 'redux-actions';
import * as R from 'ramda';

export const USERNAME_INPUT = 'username';
export const EMAIL_INPUT = 'email';
export const PASSWORD_INPUT = 'password';
export const PASSWORD_CONFIRMATION_INPUT = 'passwordConfirmation';

export default ({ getFormFieldErrors, inputs }) => {
  const { inputChange, validateInputs, submitted, serverErrors } = createActions(
    {
      INPUT_CHANGE: [(name, value) => ({ value }), (name, value) => ({ name })],
      SERVER_ERRORS: errors => ({ errors }),
    },
    'VALIDATE_INPUTS',
    'SUBMITTED',
    'SUBMITTING',
  );

  const handleInputChange = (state, action) => {
    const errors = R.pipe(
      R.prop('errors'),
      R.keys,
      R.filter(errorField => errorField != action.meta.name),
      R.reduce((errors, errorKey) => R.merge(errors, R.fromPairs([[errorKey, state.errors[errorKey]]]))),
    )(state);

    return R.merge(state, {
      inputs: R.merge(state.inputs, { [action.meta.name]: action.payload.value }),
      errors,
      submitted: false,
    });
  };

  const createDefaultState = inputs => ({
    inputs: inputs.reduce((acc, input) => R.merge(acc, { [input]: '' }), {}),
    errors: inputs.reduce((acc, input) => R.merge(acc, { [input]: null }), {}),
    isValid: false,
    submitted: false,
  });

  const defaultState = createDefaultState(inputs);

  const reducer = handleActions(
    {
      INPUT_CHANGE: handleInputChange,
      SERVER_ERRORS: (state, { payload: { errors } }) => ({
        ...state,
        errors: {
          ...state.errors,
          ...errors.reduce((errs, error) => ({
            ...errs,
            ...error,
          })),
        },
        isValid: false,
        submitted: false,
      }),
      VALIDATE_INPUTS: state => {
        const errors = getFormFieldErrors(
          Object.keys(state.inputs).reduce(
            (inputs, name) => ({
              ...inputs,
              ...(state.inputs[name] == '' ? {} : { [name]: state.inputs[name] }),
            }),
            {},
          ),
        );
        return {
          ...state,
          errors,
          isValid: Object.keys(errors).length === 0,
        };
      },
      SUBMITTED: state => ({
        ...state,
        submitted: true,
      }),
    },
    defaultState,
  );
  const getInputs = R.prop('inputs');
  const getErrors = R.prop('errors');
  const isSubmitted = R.prop('submitted');
  const isValid = R.prop('isValid');
  return {
    defaultState,
    reducer,
    getInputs,
    getErrors,
    isSubmitted,
    isValid,
    inputChange,
    validateInputs,
    submitted,
    serverErrors,
  };
};
