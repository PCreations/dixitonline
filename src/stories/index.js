import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { ApolloProvider } from 'react-apollo';

import client from '../client';
import SignupForm from '../SignupForm';
import SubmitSignupMutation from '../SignupForm/SubmitSignupMutation';

storiesOf('SignupForm', module)
  .add('display correctly', () => <SignupForm submitSignup={action('sign up form submitted')} />)
  .add('creates an account when submitted', () => (
    <ApolloProvider client={client}>
      <SubmitSignupMutation>
        {({ serverErrors, submitSignup }) => <SignupForm serverErrors={serverErrors} submitSignup={submitSignup} />}
      </SubmitSignupMutation>
    </ApolloProvider>
  ));
