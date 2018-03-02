import React from 'react';

import InputField from '../InputField';

const SignupForm = ({
  username,
  usernameError,
  email,
  emailError,
  password,
  passwordError,
  passwordConfirmation,
  passwordConfirmationError,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onPasswordConfirmationChange,
  onSubmit,
}) => {
  const _onSubmitPreventDefault = event => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <form onSubmit={_onSubmitPreventDefault}>
      <InputField
        type="text"
        name="username"
        placeholder="nom d'utilisateur"
        value={username}
        error={usernameError}
        onChange={onUsernameChange}
      />
      <InputField
        type="email"
        name="email"
        placeholder="adresse email"
        value={email}
        error={emailError}
        onChange={onEmailChange}
      />
      <InputField
        type="password"
        name="password"
        placeholder="mot de passe"
        value={password}
        error={passwordError}
        onChange={onPasswordChange}
      />
      <InputField
        type="password"
        name="passwordConfirmation"
        placeholder="confirmation du mot de passe"
        value={passwordConfirmation}
        error={passwordConfirmationError}
        onChange={onPasswordConfirmationChange}
      />
      <button type="submit" onClick={_onSubmitPreventDefault}>
        {'Créer un compte'}
      </button>
    </form>
  );
};

export default SignupForm;
