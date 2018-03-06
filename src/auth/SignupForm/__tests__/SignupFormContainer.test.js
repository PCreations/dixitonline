/*global expect jest*/
import React from 'react';
import { mount } from 'enzyme';
import {
  MISSING_FIELD,
  BAD_FORMAT,
  PASSWORDS_MISSMATCH,
  EMAIL_ALREADY_IN_USE,
  USERNAME_ALREADY_IN_USE,
  WEAK_PASSWORD,
} from '../../model';
import InputField from '../../InputField';
import SignupFormContainer from '../SignupFormContainer';

describe('SignupFormContainer', () => {
  test('should submit fields with expected values if form is valid', () => {
    const submitSignup = jest.fn(() => Promise.resolve({}));
    const wrapper = mount(<SignupFormContainer submitSignup={submitSignup} />);
    wrapper.find('input[name="username"]').simulate('change', { target: { value: 'foobar' } });
    wrapper.find('input[name="email"]').simulate('change', { target: { value: 'foobar@example.com' } });
    wrapper.find('input[name="password"]').simulate('change', { target: { value: 'password' } });
    wrapper.find('input[name="passwordConfirmation"]').simulate('change', { target: { value: 'password' } });
    wrapper.find('form').simulate('submit');
    expect(submitSignup).toHaveBeenCalledWith({
      username: 'foobar',
      email: 'foobar@example.com',
      password: 'password',
      passwordConfirmation: 'password',
    });
  });
  test('should submit fields with expected values when submitting after modifying erroneous values', () => {
    const submitSignup = jest.fn(() => Promise.resolve({}));
    const wrapper = mount(<SignupFormContainer submitSignup={submitSignup} />);
    wrapper.find('input[name="username"]').simulate('change', { target: { value: 'foobar' } });
    wrapper.find('input[name="email"]').simulate('change', { target: { value: 'example.com' } });
    wrapper.find('input[name="password"]').simulate('change', { target: { value: 'password' } });
    wrapper.find('input[name="passwordConfirmation"]').simulate('change', { target: { value: '' } });
    wrapper.find('form').simulate('submit');
    wrapper.find('input[name="email"]').simulate('change', { target: { value: 'foobar@example.com' } });
    wrapper.find('input[name="passwordConfirmation"]').simulate('change', { target: { value: 'password' } });
    wrapper.find('form').simulate('submit');
    expect(submitSignup).toHaveBeenCalledWith({
      username: 'foobar',
      email: 'foobar@example.com',
      password: 'password',
      passwordConfirmation: 'password',
    });
  });
  test('should pass a MISSING_FIELD error as prop to missing fields', () => {
    const submitSignup = jest.fn(() => Promise.resolve({}));
    const wrapper = mount(<SignupFormContainer submitSignup={submitSignup} />);
    wrapper.find('input[name="email"]').simulate('change', { target: { value: 'foobar@example.com' } });
    wrapper.find('input[name="password"]').simulate('change', { target: { value: 'password' } });
    wrapper.find('input[name="passwordConfirmation"]').simulate('change', { target: { value: 'password' } });
    wrapper.find('form').simulate('submit');
    const usernameInputField = wrapper.findWhere(
      node => node.type() === InputField && node.props().name == 'username',
    );
    expect(usernameInputField.props().error).toBe(MISSING_FIELD);
  });
  test("should pass a BAD_FORMAT error as prop to email field if it's not a valid email", () => {
    const submitSignup = jest.fn(() => Promise.resolve({}));
    const wrapper = mount(<SignupFormContainer submitSignup={submitSignup} />);
    wrapper.find('input[name="username"]').simulate('change', { target: { value: 'foo' } });
    wrapper.find('input[name="email"]').simulate('change', { target: { value: 'not@validemail@.com' } });
    wrapper.find('input[name="password"]').simulate('change', { target: { value: 'password' } });
    wrapper.find('input[name="passwordConfirmation"]').simulate('change', { target: { value: 'password' } });
    wrapper.find('form').simulate('submit');
    const emailInputField = wrapper.findWhere(
      node => node.type() === InputField && node.props().name == 'email',
    );
    expect(emailInputField.props().error).toBe(BAD_FORMAT);
  });
  test('should pass a PASSWORDS_MISSMATCH error as prop to passwordConfirmation field if passwords missmatch', () => {
    const submitSignup = jest.fn(() => Promise.resolve({}));
    const wrapper = mount(<SignupFormContainer submitSignup={submitSignup} />);
    wrapper.find('input[name="username"]').simulate('change', { target: { value: 'foo' } });
    wrapper.find('input[name="email"]').simulate('change', { target: { value: 'foo@example.com' } });
    wrapper.find('input[name="password"]').simulate('change', { target: { value: 'password' } });
    wrapper
      .find('input[name="passwordConfirmation"]')
      .simulate('change', { target: { value: 'notTheSamePassword' } });
    wrapper.find('form').simulate('submit');
    const passwordConfirmationInputField = wrapper.findWhere(
      node => node.type() === InputField && node.props().name == 'passwordConfirmation',
    );
    expect(passwordConfirmationInputField.props().error).toBe(PASSWORDS_MISSMATCH);
  });
});
