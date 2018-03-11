const test = require('tape');

const createUser = require('../../../entities/User');
const {
  createInputSignupData,
  getInputSignupDataIntegrityErrors,
  createBadEmailFormatError,
  createMissingFieldError,
  createPasswordMissmatchError,
  createWeakPasswordError,
  createEmailAlreadyInUseError,
  signup,
} = require('../InputSignupData');

process.on('unhandledRejection', console.error);

test('SignupUseCase', subtest => {

  subtest.test('createInputSignupData should return an object with given username, email, password, and passwordConfirmation props', assert => {
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example.com', password: 'bar', passwordConfirmation: 'baz' });
    assert.equal(inputSignupData.username, 'foo');
    assert.equal(inputSignupData.email, 'foo@example.com');
    assert.equal(inputSignupData.password, 'bar');
    assert.equal(inputSignupData.passwordConfirmation, 'baz');
    assert.end();
  });

  subtest.test('getInputSignupDataIntegrityErrors should return an empty list if there is no error', assert => {
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example.com', password: 'bar', passwordConfirmation: 'bar' });
    const actualErrors = getInputSignupDataIntegrityErrors(inputSignupData);
    assert.equal(actualErrors.size, 0, 'should not have error');
    assert.end();
  });

  subtest.test('getInputSignupDataIntegrityErrors should return a list containing a missing field error for each field if they are all missing', assert => {
    const inputSignupData = createInputSignupData({});
    const actualErrors = getInputSignupDataIntegrityErrors(inputSignupData);
    const expectedErrors = [
      createMissingFieldError('username'),
      createMissingFieldError('email'),
      createMissingFieldError('password'),
      createMissingFieldError('passwordConfirmation'),
    ];
    assert.ok(expectedErrors.every(actualErrors.includes.bind(actualErrors)), 'should contain a missing field error for each field');
    assert.end();
  });

  subtest.test('getInputSignupDataIntegrityErrors should return a list containing a bad email format error if email is not a valid email', assert => {
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example@com', password: 'bar', passwordConfirmation: 'bar' });
    const actualErrors = getInputSignupDataIntegrityErrors(inputSignupData);
    const expectedBadEmailFormatError = createBadEmailFormatError();
    assert.ok(actualErrors.includes(expectedBadEmailFormatError), 'should contain a bad email format error');
    assert.end();
  });

  subtest.test('getInputSignupDataIntegrityErrors should return a list containing a password missmatch error if password and passwordConfirmation don\'t match', assert => {
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example@com', password: 'bar', passwordConfirmation: 'baz' });
    const actualErrors = getInputSignupDataIntegrityErrors(inputSignupData);
    const expectedPasswordMissmatchError = createPasswordMissmatchError();
    assert.ok(actualErrors.includes(expectedPasswordMissmatchError), 'should contain a password missmatch error');
    assert.end();
  });

  subtest.test('signup should return a SignupResponse containing no user and the integrity errors if any', async assert => {
    const request = () => Promise.resolve();
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example@.com', password: 'bar', passwordConfirmation: 'bar' });
    const signupResponse = await signup({
      inputSignupData,
      isWeakPasswordError: () => false,
      isEmailAlreadyInUseError: () => false,
      getUser: () => ({}),
      request,
    });
    assert.ok(signupResponse.errors.includes(createBadEmailFormatError()));
    assert.end();
  });

  subtest.test('signup should return a SignupResponse containing a weak password error if the isWeakPasswordError function returns true for the received error from signup request', async assert => {
    const request = () => Promise.reject('weak password');
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example.com', password: 'bar', passwordConfirmation: 'bar' });
    const signupResponse = await signup({
      inputSignupData,
      isWeakPasswordError: err => err === 'weak password',
      isEmailAlreadyInUseError: () => false,
      getUser: () => ({}),
      request,
    });
    assert.ok(signupResponse.errors.includes(createWeakPasswordError()));
    assert.end();
  });

  subtest.test('signup should return a SignupResponse containing an email already in use error if the isEmailAlreadyInUseError function returns true for the received error from signup request', async assert => {
    const request = () => Promise.reject('email already in use');
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example.com', password: 'bar', passwordConfirmation: 'bar' });
    const signupResponse = await signup({
      inputSignupData,
      isWeakPasswordError: () => false,
      isEmailAlreadyInUseError: err => err === 'email already in use',
      getUser: () => ({}),
      request,
    });
    assert.ok(signupResponse.errors.includes(createEmailAlreadyInUseError()));
    assert.end();
  });

  subtest.test('signup should return a SignupResponse containing a User information given via the getUser selector from the signup request response if the signup request is successfull', async assert => {
    const request = () => Promise.resolve({ user: { username: 'foo', id: '42' } });
    const inputSignupData = createInputSignupData({ username: 'foo', email: 'foo@example.com', password: 'bar', passwordConfirmation: 'bar' });
    const signupResponse = await signup({
      inputSignupData,
      isWeakPasswordError: () => false,
      isEmailAlreadyInUseError: () => false,
      getUser: response => response.user,
      request,
    });
    assert.ok(signupResponse.user.equals(createUser({ username: 'foo', id: '42' })));
    assert.end();
  });

});