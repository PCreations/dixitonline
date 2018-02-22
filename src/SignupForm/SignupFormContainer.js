import React from 'react';
import * as R from 'ramda';
import { compose, withReducer, withProps, lifecycle } from 'recompose';

import mergeAppliedFns from '../utils/mergeAppliedFns';
import SignupForm from './SignupForm';
import { reducer, inputChange, validateInputs, submitted, defaultState } from './state';

const createInputChangeEventHandler = dispatch => inputName => event =>
  dispatch(inputChange(inputName, event.target.value));

const extractInputsPropsFromState = R.path(['formState', 'inputs']);
const buildErrorPropsFrom = R.pipe(R.toPairs, R.map(R.adjust(name => `${name}Error`, 0)), R.fromPairs);
const extractErrorsPropsFromState = R.pipe(R.path(['formState', 'errors']), buildErrorPropsFrom);
const extractErrorsPropsFromServerErrors = R.pipe(R.reduce(R.merge, {}), buildErrorPropsFrom);

const mapHandlersToProps = props => {
  const changeHandler = createInputChangeEventHandler(props.dispatchFormAction);
  return {
    onUsernameChange: changeHandler('username'),
    onEmailChange: changeHandler('email'),
    onPasswordChange: changeHandler('password'),
    onPasswordConfirmationChange: changeHandler('passwordConfirmation'),
    onSubmit: () => props.dispatchFormAction(submitted()),
  };
};

const extractSignupFormPropsFromState = mergeAppliedFns([
  extractInputsPropsFromState,
  extractErrorsPropsFromState,
  mapHandlersToProps,
]);

const FormState = withReducer('formState', 'dispatchFormAction', reducer, defaultState);
const MapFormStateToProps = withProps(extractSignupFormPropsFromState);
const SubmitSignupWhenFormIsValid = lifecycle({
  componentWillReceiveProps(nextProps) {
    if (this.props.formState.submitted === false && nextProps.formState.submitted === true) {
      this.props.dispatchFormAction(validateInputs());
    }
    if (nextProps.formState.submitted === true && nextProps.formState.isValid === true) {
      this.props.submitSignup(this.props.formState.inputs);
    }
  },
});

const enhance = compose(FormState, MapFormStateToProps, SubmitSignupWhenFormIsValid);

const FunctionAsAChild = ({ children, ...rest }) => children(rest);

const SignupFormProvider = enhance(FunctionAsAChild);

const SignupFormContainer = ({ serverErrors = [], submitSignup }) => {
  return (
    <SignupFormProvider serverErrors={serverErrors} submitSignup={submitSignup}>
      {signupFormProps => (
        <SignupForm {...R.merge(signupFormProps, extractErrorsPropsFromServerErrors(serverErrors))} />
      )}
    </SignupFormProvider>
  );
};

export default SignupFormContainer;
