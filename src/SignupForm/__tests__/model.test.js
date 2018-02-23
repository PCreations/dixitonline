/*global expect*/
import { getSignupFormFieldErrors, MISSING_FIELD, BAD_FORMAT, PASSWORDS_MISSMATCH } from '../model';

describe('signup form data client validation', () => {
  test('all fields are correctly filled', () => {
    const actual = getSignupFormFieldErrors({
      username: 'foo',
      email: 'foo@example.com',
      password: 'pass',
      passwordConfirmation: 'pass',
    });
    const expected = {};
    expect(actual).toEqual(expected);
  });
  test('username field is missing', () => {
    const actual = getSignupFormFieldErrors({
      email: 'foo@example.com',
      password: 'pass',
      passwordConfirmation: 'pass',
    });
    const expected = {
      username: MISSING_FIELD,
    };
    expect(actual).toEqual(expected);
  });
  test('email field is missing', () => {
    const actual = getSignupFormFieldErrors({
      username: 'foo',
      password: 'pass',
      passwordConfirmation: 'pass',
    });
    const expected = {
      email: MISSING_FIELD,
    };
    expect(actual).toEqual(expected);
  });
  test('password field is missing', () => {
    const actual = getSignupFormFieldErrors({
      email: 'foo@example.com',
      username: 'foo',
      passwordConfirmation: 'pass',
    });
    const expected = {
      password: MISSING_FIELD,
      passwordConfirmation: PASSWORDS_MISSMATCH,
    };
    expect(actual).toEqual(expected);
  });
  test('passwordConfirmation field is missing', () => {
    const actual = getSignupFormFieldErrors({
      email: 'foo@example.com',
      username: 'foo',
      password: 'pass',
    });
    const expected = {
      passwordConfirmation: MISSING_FIELD,
    };
    expect(actual).toEqual(expected);
  });
  test('many fields are missing', () => {
    const actual = getSignupFormFieldErrors({
      username: 'foo',
      password: 'pass',
    });
    const expected = {
      email: MISSING_FIELD,
      passwordConfirmation: MISSING_FIELD,
    };
    expect(actual).toEqual(expected);
  });
  test('good email format', () => {
    const actual = getSignupFormFieldErrors({
      username: 'foo',
      email: 'foo@example.com',
      password: 'pass',
      passwordConfirmation: 'pass',
    });
    const expected = {};
    expect(actual).toEqual(expected);
  });
  test('bad email format', () => {
    const actual = getSignupFormFieldErrors({
      username: 'foo',
      email: 'foo@example',
      password: 'pass',
      passwordConfirmation: 'pass',
    });
    const expected = {
      email: BAD_FORMAT,
    };
    expect(actual).toEqual(expected);
  });
  test('password confirmation different from password', () => {
    const actual = getSignupFormFieldErrors({
      username: 'foo',
      email: 'foo@example.com',
      password: 'pass',
      passwordConfirmation: 'differentPass',
    });
    const expected = {
      passwordConfirmation: PASSWORDS_MISSMATCH,
    };
    expect(actual).toEqual(expected);
  });
});
