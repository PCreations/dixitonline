import createFormState, {
  USERNAME_INPUT,
  EMAIL_INPUT,
  PASSWORD_INPUT,
  PASSWORD_CONFIRMATION_INPUT,
} from '../createFormState';
import { getSignupFormFieldErrors } from '../model';

export const {
  defaultState,
  reducer,
  getInputs,
  getErrors,
  inputChange,
  validateInputs,
  submitted,
} = createFormState({
  getFormFieldErrors: getSignupFormFieldErrors,
  inputs: [USERNAME_INPUT, EMAIL_INPUT, PASSWORD_INPUT, PASSWORD_CONFIRMATION_INPUT],
});
