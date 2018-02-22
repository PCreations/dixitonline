import { createActions, handleActions } from 'redux-actions';

import { getSignupFormFieldErrors } from './model';

export const defaultState = {
  inputs: {
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  },
  errors: {
    username: null,
    email: null,
    password: null,
    passwordConfirmation: null,
  },
  isValid: false,
  submitted: false,
};

export const { inputChange, validateInputs, submitted } = createActions(
  {
    INPUT_CHANGE: [(name, value) => ({ value }), (name, value) => ({ name })],
  },
  'VALIDATE_INPUTS',
  'SUBMITTED',
);

export const reducer = handleActions(
  {
    INPUT_CHANGE: (state, action) => {
      const errors = Object.keys(state.errors || {})
        .filter(errorField => errorField != action.meta.name)
        .reduce(
          (errors, errorKey) => ({
            ...errors,
            [errorKey]: state.errors[errorKey],
          }),
          {},
        );
      return {
        ...state,
        inputs: {
          ...state.inputs,
          [action.meta.name]: action.payload.value,
        },
        errors,
        submitted: false,
      };
    },
    VALIDATE_INPUTS: state => {
      const errors = getSignupFormFieldErrors(
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
