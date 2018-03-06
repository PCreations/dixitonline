import React from 'react';
import SignupFormContainer from './SignupFormContainer';
import SubmitSignupMutation from './SubmitSignupMutation';

export default () => (
  <SubmitSignupMutation>{props => <SignupFormContainer {...props} />}</SubmitSignupMutation>
);
