import { graphql } from 'react-apollo';

import SignupFormContainer from './SignupFormContainer';
import SubmitSignupMutation from './SubmitSignupMutation';
import SUBMIT_SIGNUP_MUTATION from './submitSignupMutation.graphql';

export default graphql(SUBMIT_SIGNUP_MUTATION, {
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
    SignupForm: SignupFormContainer,
  }),
})(SubmitSignupMutation);
