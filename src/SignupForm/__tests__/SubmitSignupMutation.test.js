/*global expect jest*/
import React from 'react';
import { mount } from 'enzyme';

import SubmitSignupMutation from '../SubmitSignupMutation';

test('SubmitSignupMutation should provide a submitSignup function to SubmitSignup component prop with correct arguments', () => {
  const submitSignup = jest.fn(() =>
    Promise.resolve({
      success: true,
      errors: [],
    }),
  );
  const DummySignupForm = ({ submitSignup }) => {
    submitSignup({
      username: 'foo',
      email: 'foo@example.com',
      password: 'pass',
      passwordConfirmation: 'pass',
    });
    return null;
  };
  mount(<SubmitSignupMutation submitSignup={submitSignup} SignupForm={DummySignupForm} />);
  expect(submitSignup).toHaveBeenCalledWith({ email: 'foo@example.com', password: 'pass', username: 'foo' });
});

test('SubmitSignupMutation should provide serverErrors prop to SubmitSignup component prop if given submitSignup returns errors', () => {
  const submitSignup = () =>
    Promise.resolve({
      success: false,
      errors: [{ some: 'error' }],
    });
  let isSubmitted = false;
  const DummySignupForm = ({ submitSignup, serverErrors }) => {
    if (isSubmitted) {
      expect(serverErrors).toEqual([{ some: 'error' }]);
    } else {
      submitSignup({
        username: 'foo',
        email: 'foo@example.com',
        password: 'pass',
        passwordConfirmation: 'pass',
      });
      isSubmitted = true;
    }
    return null;
  };
  mount(<SubmitSignupMutation submitSignup={submitSignup} SignupForm={DummySignupForm} />);
});
