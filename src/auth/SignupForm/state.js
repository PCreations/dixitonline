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
  isSubmitted,
  isValid,
  inputChange,
  validateInputs,
  submitted,
  serverErrors,
} = createFormState({
  getFormFieldErrors: getSignupFormFieldErrors,
  inputs: [USERNAME_INPUT, EMAIL_INPUT, PASSWORD_INPUT, PASSWORD_CONFIRMATION_INPUT],
});
