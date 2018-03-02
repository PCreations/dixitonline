import { pipe, reduce, merge } from 'ramda';

export const MISSING_FIELD = 'MISSING_FIELD';
export const BAD_FORMAT = 'BAD_FORMAT';
export const PASSWORDS_MISSMATCH = 'PASSWORDS_MISSMATCH';
export const WEAK_PASSWORD = 'WEAK_PASSWORD';
export const USERNAME_ALREADY_IN_USE = 'USERNAME_ALREADY_IN_USE';
export const EMAIL_ALREADY_IN_USE = 'EMAIL_ALREADY_IN_USE';
export const BAD_CREDENTIALS = 'BAD_CREDENTIALS';
const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

const getMissingFields = mandatoryFields => fields =>
  mandatoryFields.filter(mandatoryField => typeof fields[mandatoryField] === 'undefined');

const buildMissingFieldsErrors = reduce((errors, field) => merge(errors, { [field]: MISSING_FIELD }), {});

const isValidEmail = email => (typeof email == 'undefined' ? false : email.match(EMAIL_REGEX) !== null);

const arePasswordsMatching = ({ password, passwordConfirmation }) => passwordConfirmation === password;

export const validateRequiredFields = mandatoryFields =>
  pipe(getMissingFields(mandatoryFields), buildMissingFieldsErrors);

const validateEmailFormat = ({ email }) => (isValidEmail(email) ? {} : { email: BAD_FORMAT });

const validatePasswordsMatching = ({ password, passwordConfirmation }) =>
  arePasswordsMatching({ password, passwordConfirmation })
    ? {}
    : { passwordConfirmation: PASSWORDS_MISSMATCH };

export const applyValidators = validators => fields =>
  validators.reduce((errors, validator) => merge(errors, validator(fields)), {});

export const getSignupFormFieldErrors = applyValidators([
  validateEmailFormat,
  validatePasswordsMatching,
  validateRequiredFields(['username', 'email', 'password', 'passwordConfirmation']),
]);

export const getLoginFormFieldErrors = applyValidators([validateRequiredFields(['email', 'password'])]);
