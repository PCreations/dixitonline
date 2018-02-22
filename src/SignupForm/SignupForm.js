import React from 'react';

import {
  MISSING_FIELD,
  BAD_FORMAT,
  PASSWORDS_MISSMATCH,
  EMAIL_ALREADY_IN_USE,
  USERNAME_ALREADY_IN_USE,
  WEAK_PASSWORD,
} from './model';

const errorMessagesMap = {
  [MISSING_FIELD]: 'Ce champ est requis',
  [BAD_FORMAT]: 'Mauvais format',
  [PASSWORDS_MISSMATCH]: 'Les mots de passe ne correspondent pas',
  [EMAIL_ALREADY_IN_USE]: 'Cette adresse email est déjà utilisé',
  [USERNAME_ALREADY_IN_USE]: "Ce nom d'utilisateur est déjà utilisé",
  [WEAK_PASSWORD]: 'Mot de passe trop simple',
};

export const ErrorMessage = ({ error }) => <p style={{ color: 'red' }}>{errorMessagesMap[error]}</p>;

export const InputField = ({ error, ...baseInputProps }) => (
  <div>
    <input {...baseInputProps} />
    {error && <ErrorMessage error={error} />}
  </div>
);

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
