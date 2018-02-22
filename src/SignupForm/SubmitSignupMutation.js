import React from 'react';
import withState from 'recompose/withState';
import withProps from 'recompose/withProps';
import compose from 'recompose/compose';

const ServerErrorsState = withState('serverErrors', 'setServerErrors', []);

const SetErrorsStateOnSignupFailure = withProps(({ submitSignup, setServerErrors }) => ({
  submitSignup: async ({ username, email, password }) => {
    const { success, errors } = await submitSignup({ username, email, password });
    if (success === false) {
      setServerErrors(errors);
    }
  },
}));

const enhance = compose(ServerErrorsState, SetErrorsStateOnSignupFailure);

export default enhance(({ serverErrors, submitSignup, SignupForm }) => (
  <SignupForm serverErrors={serverErrors} submitSignup={submitSignup} />
));
