/*global expect jest*/
import React from 'react';
import { shallow, mount } from 'enzyme';
import LoginForm from '../LoginForm';
import InputField from '../../InputField';

describe('login form', () => {
  test('should contain a form element', () => {
    const wrapper = shallow(<LoginForm />);
    expect(wrapper.type()).toBe('form');
  });
  test('should contain a email InputField with the email prop as value', () => {
    const wrapper = shallow(<LoginForm email="foo@example.com" />);
    expect(
      wrapper.contains(
        <InputField type="email" name="email" placeholder="adresse email" value="foo@example.com" />,
      ),
    ).toBe(true);
  });
  test('should contain a password InputField', () => {
    const wrapper = shallow(<LoginForm password={'password'} />);
    expect(
      wrapper.contains(
        <InputField type="password" name="password" placeholder="mot de passe" value={'password'} />,
      ),
    ).toBe(true);
  });
  test('should submit form when clicking on the submit button', () => {
    const onSubmit = jest.fn();
    const wrapper = mount(<LoginForm onSubmit={onSubmit} />);
    wrapper.find('button[type="submit"]').simulate('click');
    expect(onSubmit).toHaveBeenCalled();
  });
  test('should call the onSubmit callback prop when submitting form and prevent default submit action', () => {
    const preventDefault = jest.fn();
    const onSubmit = jest.fn();
    const wrapper = shallow(<LoginForm onSubmit={onSubmit} />);
    wrapper.simulate('submit', { preventDefault });
    expect(onSubmit).toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalled();
  });
});
