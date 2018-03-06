import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import SignupForm from '../SignupForm/SignupFormContainer';

storiesOf('auth', module).add('SignupForm', () => (
  <SignupForm submitSignup={action('sign up form submitted')} />
));
