import React from 'react';
import PropTypes from 'prop-types';
import * as R from 'ramda';
import { withReducer } from 'recompose';

import SignupForm from './SignupForm';
import {
  inputChange,
  submitted,
  serverErrors,
  reducer,
  defaultState,
  validateInputs,
  getInputs,
  getErrors,
  isSubmitted,
  isValid,
} from './state';

class SignupFormContainer extends React.Component {
  constructor(props) {
    super(props);
    this.handlers = this._mapHandlersToProps(props);
  }

  componentWillReceiveProps = nextProps => {
    if (this._isFormBeingSubmitted(this.props.formState, nextProps.formState)) {
      this.props.dispatchFormAction(validateInputs());
    } else if (this._isFormValidAfterSubmitting(nextProps.formState)) {
      try {
        this._submitSignup(this.props);
      } catch (e) {}
    }
  };

  _isFormBeingSubmitted = (formState, nextFormState) => !isSubmitted(formState) && isSubmitted(nextFormState);

  _isFormValidAfterSubmitting = nextFormState => isSubmitted(nextFormState) && isValid(nextFormState);

  _submitSignup = async props => {
    const { success, errors } = await props.submitSignup(getInputs(props.formState));
    if (success === false) {
      props.dispatchFormAction(serverErrors(errors));
    }
  };

  _mapHandlersToProps = props => {
    const changeHandler = this._createInputChangeEventHandler(props.dispatchFormAction);
    return {
      onUsernameChange: changeHandler('username'),
      onEmailChange: changeHandler('email'),
      onPasswordChange: changeHandler('password'),
      onPasswordConfirmationChange: changeHandler('passwordConfirmation'),
      onSubmit: () => props.dispatchFormAction(submitted()),
    };
  };

  _createInputChangeEventHandler = dispatch => inputName => event =>
    dispatch(inputChange(inputName, event.target.value));

  _buildErrorPropsFrom = R.pipe(R.toPairs, R.map(R.adjust(name => `${name}Error`, 0)), R.fromPairs);

  render() {
    const signupFormProps = {
      ...this.handlers,
      ...getInputs(this.props.formState),
      ...this._buildErrorPropsFrom(getErrors(this.props.formState)),
    };
    return <SignupForm {...signupFormProps} />;
  }
}

SignupFormContainer.propTypes = {
  formState: PropTypes.object.isRequired,
  dispatchFormAction: PropTypes.func.isRequired,
  serverErrors: PropTypes.arrayOf(PropTypes.object),
  submitSignup: PropTypes.func.isRequired,
};
SignupFormContainer.defaultProps = {
  serverErrors: [],
};

export default withReducer('formState', 'dispatchFormAction', reducer, defaultState)(SignupFormContainer);
