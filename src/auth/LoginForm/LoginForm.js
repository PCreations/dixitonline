import React from 'react';

import InputField from '../InputField';

const LoginForm = ({
  email,
  emailError,
  password,
  passwordError,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) => {
  const _onSubmitPreventDefault = event => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <form onSubmit={_onSubmitPreventDefault}>
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
      <button type="submit" onClick={_onSubmitPreventDefault}>
        {'Connexion'}
      </button>
    </form>
  );
};

export default LoginForm;
