/*global expect*/

const createUser = require('../../entities/User');
const {
  createInputSignupData,
  getInputSignupDataIntegrityErrors,
  createBadEmailFormatError,
  createMissingFieldError,
  createPasswordMissmatchError,
  createWeakPasswordError,
  createEmailAlreadyInUseError,
  createSignupUseCase,
} = require('../SignupUseCase');

process.on('unhandledRejection', console.error);

describe('SignupUseCase', () => {

  test('createInputSignupData should return an object with given username, email, password, and passwordConfirmation props', () => {
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example.com', password: 'bar', passwordConfirmation: 'baz' });
    expect(inputSignupData.username,).toBe('foo');
    expect(inputSignupData.email).toBe('foo@example.com');
    expect(inputSignupData.password).toBe('bar');
    expect(inputSignupData.passwordConfirmation).toBe('baz');
  });

  test('getInputSignupDataIntegrityErrors should return an empty list if there is no error', () => {
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example.com', password: 'bar', passwordConfirmation: 'bar' });
    const actualErrors = getInputSignupDataIntegrityErrors(inputSignupData);
    expect(actualErrors.size).toBe(0);
  });

  test('getInputSignupDataIntegrityErrors should return a list containing a missing field error for each field if they are all missing', () => {
    const inputSignupData = createInputSignupData({});
    const actualErrors = getInputSignupDataIntegrityErrors(inputSignupData);
    const expectedErrors = [
      createMissingFieldError('username'),
      createMissingFieldError('email'),
      createMissingFieldError('password'),
      createMissingFieldError('passwordConfirmation'),
    ];
    expect(expectedErrors.every(actualErrors.includes.bind(actualErrors))).toBe(true);
  });

  test('getInputSignupDataIntegrityErrors should return a list containing a bad email format error if email is not a valid email', () => {
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example@com', password: 'bar', passwordConfirmation: 'bar' });
    const actualErrors = getInputSignupDataIntegrityErrors(inputSignupData);
    const expectedBadEmailFormatError = createBadEmailFormatError();
    expect(actualErrors.includes(expectedBadEmailFormatError)).toBe(true);
  });

  test('getInputSignupDataIntegrityErrors should return a list containing a password missmatch error if password and passwordConfirmation don\'t match', () => {
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example@com', password: 'bar', passwordConfirmation: 'baz' });
    const actualErrors = getInputSignupDataIntegrityErrors(inputSignupData);
    const expectedPasswordMissmatchError = createPasswordMissmatchError();
    expect(actualErrors.includes(expectedPasswordMissmatchError)).toBe(true);
  });

  test('signupUseCase should return a SignupResponse containing no user and the integrity errors if any', async () => {
    const request = () => Promise.resolve();
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example@.com', password: 'bar', passwordConfirmation: 'bar' });
    const signupUseCase = createSignupUseCase({
      inputSignupData,
      isWeakPasswordError: () => false,
      isEmailAlreadyInUseError: () => false,
      getUser: () => ({}),
      request,
    });
    const signupResponse = await signupUseCase();
    expect(signupResponse.errors.includes(createBadEmailFormatError())).toBe(true);
  });

  test('signupUseCase should return a SignupResponse containing a weak password error if the isWeakPasswordError function returns true for the received error from signup request', async () => {
    const request = () => Promise.reject('weak password');
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example.com', password: 'bar', passwordConfirmation: 'bar' });
    const signupUseCase = createSignupUseCase({
      inputSignupData,
      isWeakPasswordError: err => err === 'weak password',
      isEmailAlreadyInUseError: () => false,
      getUser: () => ({}),
      request,
    });
    const signupResponse = await signupUseCase();
    expect(signupResponse.errors.includes(createWeakPasswordError())).toBe(true);
  });

  test('signupUseCase should return a SignupResponse containing an email already in use error if the isEmailAlreadyInUseError function returns true for the received error from signup request', async () => {
    const request = () => Promise.reject('email already in use');
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example.com', password: 'bar', passwordConfirmation: 'bar' });
    const signupUseCase = createSignupUseCase({
      inputSignupData,
      isWeakPasswordError: () => false,
      isEmailAlreadyInUseError: err => err === 'email already in use',
      getUser: () => ({}),
      request,
    });
    const signupResponse = await signupUseCase();
    expect(signupResponse.errors.includes(createEmailAlreadyInUseError())).toBe(true);
  });

  test('signupUseCase should return a SignupResponse containing a User information given via the getUser selector from the signup request response if the signup request is successfull', async () => {
    const request = () => Promise.resolve({ user: { username: 'foo', id: '42' } });
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example.com', password: 'bar', passwordConfirmation: 'bar' });
    const signupUseCase = createSignupUseCase({
      inputSignupData,
      isWeakPasswordError: () => false,
      isEmailAlreadyInUseError: () => false,
      getUser: response => response.user,
      request,
    });
    const signupResponse = await signupUseCase();
    expect(signupResponse.user.equals(createUser({ username: 'foo', id: '42' }))).toBe(true);
  });

});