import * as R from 'ramda';

import mergeAppliedFns from '../utils/mergeAppliedFns';

export const MISSING_FIELD = 'MISSING_FIELD';
export const BAD_FORMAT = 'BAD_FORMAT';
export const PASSWORDS_MISSMATCH = 'PASSWORDS_MISSMATCH';
export const EMAIL_ALREADY_IN_USE = 'EMAIL_ALREADY_IN_USE';
export const USERNAME_ALREADY_IN_USE = 'USERNAME_ALREADY_IN_USE';
export const WEAK_PASSWORD = 'WEAK_PASSWORD';

const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

const getMissingFields = mandatoryFields => R.pipe(R.keys, R.difference(mandatoryFields));

const createObjectFromKeysWithValue = value => R.pipe(R.map(f => [f, MISSING_FIELD]), R.fromPairs);

const isValidEmail = email => (typeof email == 'undefined' ? false : email.match(EMAIL_REGEX) !== null);

const validateEmailFormat = R.pipe(
  R.prop('email'),
  R.ifElse(isValidEmail, R.always({}), R.always({ email: BAD_FORMAT })),
);

const validatePasswordsMatch = R.pipe(
  R.props(['password', 'passwordConfirmation']),
  R.ifElse(R.apply(R.equals), R.always({}), R.always({ passwordConfirmation: PASSWORDS_MISSMATCH })),
);

const validateMandatoryFields = R.pipe(
  getMissingFields(['username', 'email', 'password', 'passwordConfirmation']),
  createObjectFromKeysWithValue(MISSING_FIELD),
);

export const getSignupFormFieldErrors = mergeAppliedFns([
  validatePasswordsMatch,
  validateEmailFormat,
  validateMandatoryFields,
]);

//const submitSignup = ({ signupData, sendSignup }) => sendSignup(signupData).

/*

Mutation: {
  signup: (root, signupData, context) => context.SignupForm.submit(signupData)
}
Subscription: {
  userAuthenticated: () => {
    subscribe: () => pubsub.asyncIterator('OnUserAuthenticated');
  }
}

FirebaseConnector :

*/
