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

export default ({ error, ...baseInputProps }) => (
  <div>
    <input {...baseInputProps} />
    {error && <ErrorMessage error={error} />}
  </div>
);
