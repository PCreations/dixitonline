const { Record, List } = require('immutable');

const InputSignupData = Record({ username: null, email: null, password: null, passwordConfirmation: null });

const OutputSignupData = Record({ user: null, errors: List() });

const createInputSignupData = signupData => new InputSignupData(signupData);

const signup = async inputSignupData => {};
