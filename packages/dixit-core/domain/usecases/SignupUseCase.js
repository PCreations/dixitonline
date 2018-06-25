const { Record, List } = require('immutable');

const createUser = require('../entities/User');

const BAD_FORMAT = 'BAD_FORMAT';
const MISSING_FIELD = 'MISSING_FIELD';
const PASSWORDS_MISSMATCH = 'PASSWORDS_MISSMATCH';
const WEAK_PASSWORD = 'WEAK_PASSWORD';
const EMAIL_ALREADY_IN_USE = 'EMAIL_ALREADY_IN_USE';
const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

const InputSignupData = Record({ username: null, email: null, password: null, passwordConfirmation: null });
const SignupResponse = Record({ user: null, errors: List() });
const SignupDataError = Record({ field: null, error: null });

const isValidEmail = email => (email == null ? false : email.match(EMAIL_REGEX) !== null);
const isFieldMissing = field => field == null;
const arePasswordsMatching = ({ password, passwordConfirmation }) => password === passwordConfirmation;

const createInputSignupData = props => new InputSignupData(props);

const createBadEmailFormatError = () => new SignupDataError({ field: 'username', error: BAD_FORMAT });

const createMissingFieldError = field => new SignupDataError({ field, error: MISSING_FIELD });

const createPasswordMissmatchError = () =>
  new SignupDataError({ field: 'passwordConfirmation', erorr: PASSWORDS_MISSMATCH });

const createWeakPasswordError = () => new SignupDataError({ field: 'password', error: WEAK_PASSWORD });

const createEmailAlreadyInUseError = () =>
  new SignupDataError({ field: 'email', error: EMAIL_ALREADY_IN_USE });

const createSignupResponse = ({ user, errors }) => new SignupResponse({ user, errors: List(errors) });

const getInputSignupDataIntegrityErrors = inputSignupData =>
  List()
    .concat(
      inputSignupData
        .toSeq()
        .filter(isFieldMissing)
        .map((_, field) => createMissingFieldError(field))
        .toList(),
      isValidEmail(inputSignupData.email) ? List() : List.of(createBadEmailFormatError()),
      arePasswordsMatching(inputSignupData) ? List() : List.of(createPasswordMissmatchError()),
    )
    .filter(val => val !== null);

const createSignupRequest = ({
  isWeakPasswordError,
  isEmailAlreadyInUseError,
  getUser,
  request,
}) => async () => {
  try {
    const result = await request();
    const user = getUser(result);
    return createSignupResponse({
      user: createUser({
        username: user.username,
        id: user.id,
      }),
    });
  } catch (err) {
    if (isWeakPasswordError(err)) {
      return createSignupResponse({ errors: [createWeakPasswordError()] });
    }
    if (isEmailAlreadyInUseError(err)) {
      return createSignupResponse({ errors: [createEmailAlreadyInUseError()] });
    }
    throw err;
  }
};

const createSignupUseCase = ({
  inputSignupData,
  isWeakPasswordError,
  isEmailAlreadyInUseError,
  getUser,
  request,
}) => async () => {
  const signupRequest = createSignupRequest({
    isWeakPasswordError,
    isEmailAlreadyInUseError,
    getUser,
    request,
  });
  const integrityErrors = getInputSignupDataIntegrityErrors(inputSignupData);
  if (integrityErrors.size > 0) {
    return createSignupResponse({ errors: integrityErrors });
  }
  return await signupRequest(inputSignupData);
};

module.exports = {
  createInputSignupData,
  getInputSignupDataIntegrityErrors,
  createBadEmailFormatError,
  createMissingFieldError,
  createPasswordMissmatchError,
  createWeakPasswordError,
  createEmailAlreadyInUseError,
  createSignupUseCase,
};
