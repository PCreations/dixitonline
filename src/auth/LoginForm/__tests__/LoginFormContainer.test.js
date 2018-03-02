/*global expect jest*/
import React from 'react';
import { mount } from 'enzyme';
import { MISSING_FIELD, BAD_CREDENTIALS } from '../../model';
import InputField from '../../InputField';
import LoginFormContainer from '../LoginFormContainer';

describe('LoginFormContainer', () => {
  test('should submit fields with expected values if form is valid', () => {
    const submitLogin = jest.fn();
    const wrapper = mount(<LoginFormContainer submitLogin={submitLogin} />);
    wrapper.find('input[name="email"]').simulate('change', { target: { value: 'foobar@example.com' } });
    wrapper.find('input[name="password"]').simulate('change', { target: { value: 'password' } });
    wrapper.find('form').simulate('submit');
    expect(submitLogin).toHaveBeenCalledWith({
      email: 'foobar@example.com',
      password: 'password',
    });
  });
  test('should submit fields with expected values when submitting after modifying erroneous values', () => {
    const submitLogin = jest.fn();
    const wrapper = mount(<LoginFormContainer submitLogin={submitLogin} />);
    wrapper.find('input[name="email"]').simulate('change', { target: { value: 'example.com' } });
    wrapper.find('form').simulate('submit');
    wrapper.find('input[name="email"]').simulate('change', { target: { value: 'foobar@example.com' } });
    wrapper.find('input[name="password"]').simulate('change', { target: { value: 'password' } });
    wrapper.find('form').simulate('submit');
    expect(submitLogin).toHaveBeenCalledWith({
      email: 'foobar@example.com',
      password: 'password',
    });
  });
  test('should pass a MISSING_FIELD error as prop to missing fields', () => {
    const submitLogin = jest.fn();
    const wrapper = mount(<LoginFormContainer submitLogin={submitLogin} />);
    wrapper.find('input[name="password"]').simulate('change', { target: { value: 'password' } });
    wrapper.find('form').simulate('submit');
    const emailInputField = wrapper.findWhere(
      node => node.type() === InputField && node.props().name == 'email',
    );
    expect(emailInputField.props().error).toBe(MISSING_FIELD);
  });
  test('should pass a BAD_CREDENTIALS error as prop to email and password fields if it receives this error in serverErrors props', () => {
    const wrapper = mount(
      <LoginFormContainer serverErrors={[{ email: 'BAD_CREDENTIALS', password: 'BAD_CREDENTIALS' }]} />,
    );
    const passwordInputField = wrapper.findWhere(
      node => node.type() === InputField && node.props().name == 'password',
    );
    const emailInputField = wrapper.findWhere(
      node => node.type() === InputField && node.props().name == 'email',
    );
    expect(passwordInputField.props().error).toBe(BAD_CREDENTIALS);
    expect(emailInputField.props().error).toBe(BAD_CREDENTIALS);
  });
});
