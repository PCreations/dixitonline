/*global expect jest*/
import React from 'react';
import { shallow, mount } from 'enzyme';
import { MISSING_FIELD, BAD_FORMAT, PASSWORDS_MISSMATCH } from '../model';
import SignupForm, { InputField, ErrorMessage } from '../SignupForm';

describe('InputField', () => {
  test('should call given onChange callback property on change event', () => {
    const onChange = jest.fn();
    const wrapper = shallow(<InputField type="text" onChange={onChange} />);
    wrapper.find('input').simulate('change', { target: { value: 'foo' } });
    expect(onChange).toHaveBeenCalledWith({ target: { value: 'foo' } });
  });
  test('should render a ErrorMessage with the given error props if any', () => {
    const wrapper = shallow(<InputField type="text" error={MISSING_FIELD} />);
    const expectedErrorMessage = wrapper.find(ErrorMessage);
    expect(expectedErrorMessage.exists()).toBe(true);
    expect(expectedErrorMessage.props().error).toBe(MISSING_FIELD);
  });
});

describe('signup form', () => {
  test('should contain a form element', () => {
    const wrapper = shallow(<SignupForm />);
    expect(wrapper.type()).toBe('form');
  });
  test('should contain a username text InputField with the username prop as value', () => {
    const wrapper = shallow(<SignupForm username="foo" />);
    expect(
      wrapper.contains(
        <InputField type="text" name="username" placeholder="nom d'utilisateur" value="foo" />,
      ),
    ).toBe(true);
  });
  test('should contain a email InputField with the email prop as value', () => {
    const wrapper = shallow(<SignupForm email="foo@example.com" />);
    expect(
      wrapper.contains(
        <InputField type="email" name="email" placeholder="adresse email" value="foo@example.com" />,
      ),
    ).toBe(true);
  });
  test('should contain a password InputField', () => {
    const wrapper = shallow(<SignupForm password={'password'} />);
    expect(
      wrapper.contains(
        <InputField type="password" name="password" placeholder="mot de passe" value={'password'} />,
      ),
    ).toBe(true);
  });
  test('should contain a password confirmation InputField', () => {
    const wrapper = shallow(<SignupForm passwordConfirmation={'passwordConfirmation'} />);
    expect(
      wrapper.contains(
        <InputField
          type="password"
          name="passwordConfirmation"
          placeholder="confirmation du mot de passe"
          value="passwordConfirmation"
        />,
      ),
    ).toBe(true);
  });
  test('should submit form when clicking on the submit button', () => {
    const onSubmit = jest.fn();
    const wrapper = mount(<SignupForm onSubmit={onSubmit} />);
    wrapper.find('button[type="submit"]').simulate('click');
    expect(onSubmit).toHaveBeenCalled();
  });
  test('should call the onSubmit callback prop when submitting form and prevent default submit action', () => {
    const preventDefault = jest.fn();
    const onSubmit = jest.fn();
    const wrapper = shallow(<SignupForm onSubmit={onSubmit} />);
    wrapper.simulate('submit', { preventDefault });
    expect(onSubmit).toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalled();
  });
});
