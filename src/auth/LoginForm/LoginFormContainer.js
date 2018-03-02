import React from 'react';
import * as R from 'ramda';
import { compose, withReducer, withProps, lifecycle } from 'recompose';

import mergeAppliedFns from '../../utils/mergeAppliedFns';
import LoginForm from './LoginForm';
import { inputChange, submitted, reducer, defaultState, validateInputs } from './state';

const createInputChangeEventHandler = dispatch => inputName => event =>
  dispatch(inputChange(inputName, event.target.value));

const extractInputsPropsFromState = R.path(['formState', 'inputs']);
const buildErrorPropsFrom = R.pipe(R.toPairs, R.map(R.adjust(name => `${name}Error`, 0)), R.fromPairs);
const extractErrorsPropsFromState = R.pipe(R.path(['formState', 'errors']), buildErrorPropsFrom);
const extractErrorsPropsFromServerErrors = R.pipe(R.reduce(R.merge, {}), buildErrorPropsFrom);

const mapHandlersToProps = props => {
  const changeHandler = createInputChangeEventHandler(props.dispatchFormAction);
  return {
    onEmailChange: changeHandler('email'),
    onPasswordChange: changeHandler('password'),
    onSubmit: () => props.dispatchFormAction(submitted()),
  };
};

const extractLoginFormPropsFromState = mergeAppliedFns([
  extractInputsPropsFromState,
  extractErrorsPropsFromState,
  mapHandlersToProps,
]);

const FormState = withReducer('formState', 'dispatchFormAction', reducer, defaultState);
const MapFormStateToProps = withProps(extractLoginFormPropsFromState);
const SubmitLoginWhenFormIsValid = lifecycle({
  componentWillReceiveProps(nextProps) {
    if (this.props.formState.submitted === false && nextProps.formState.submitted === true) {
      this.props.dispatchFormAction(validateInputs());
    }
    if (nextProps.formState.submitted === true && nextProps.formState.isValid === true) {
      this.props.submitLogin(this.props.formState.inputs);
    }
  },
});

const enhance = compose(FormState, MapFormStateToProps, SubmitLoginWhenFormIsValid);

const FunctionAsAChild = ({ children, ...rest }) => children(rest);

const LoginFormProvider = enhance(FunctionAsAChild);

const LoginFormContainer = ({ serverErrors = [], submitLogin }) => (
  <LoginFormProvider serverErrors={serverErrors} submitLogin={submitLogin}>
    {loginFormProps => (
      <LoginForm {...R.merge(loginFormProps, extractErrorsPropsFromServerErrors(serverErrors))} />
    )}
  </LoginFormProvider>
);

export default LoginFormContainer;
