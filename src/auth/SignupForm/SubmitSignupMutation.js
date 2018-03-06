import React from 'react';
import { graphql } from 'react-apollo';
import compose from 'recompose/compose';

import SUBMIT_SIGNUP_MUTATION from './submitSignupMutation.graphql';

const enhance = graphql(SUBMIT_SIGNUP_MUTATION, {
  props: props => ({
    submitSignup: async ({ username, email, password }) => {
      const { data } = await props.mutate({
        variables: {
          signupData: { username, email, password },
        },
      });
      return {
        success: data.submitSignup.success,
        errors: data.submitSignup.errors.reduce(
          (errors, error) => errors.concat({ [error.field]: error.reason }),
          [],
        ),
      };
    },
  }),
});

export default enhance(({ submitSignup, children }) => children({ submitSignup }));
