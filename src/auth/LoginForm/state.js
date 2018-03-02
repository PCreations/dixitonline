import createFormState, { EMAIL_INPUT, PASSWORD_INPUT } from '../createFormState';
import { getLoginFormFieldErrors } from '../model';

export const {
  defaultState,
  reducer,
  getInputs,
  getErrors,
  inputChange,
  validateInputs,
  submitted,
} = createFormState({
  getFormFieldErrors: getLoginFormFieldErrors,
  inputs: [EMAIL_INPUT, PASSWORD_INPUT],
});
