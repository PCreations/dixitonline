/** @jsx h */
import { h } from 'preact';

export interface LoginFormProps {
  readonly variant: 'page' | 'modal';
}

/**
 * Login form with 2 sections:
 * 1. "Jouer en tant qu'invité" - username only (anonymous auth)
 * 2. "S'inscrire / Se connecter" - email only (magic link)
 *
 * Uses Alpine.js loginForm() store for state management.
 */
export function LoginForm({ variant }: LoginFormProps) {
  const isModal = variant === 'modal';
  const formClass = isModal ? 'login-form login-form--modal' : 'login-form login-form--page';
  const buttonClass = isModal ? 'auth-modal-button' : 'login-button';
  const inputClass = isModal ? 'auth-modal-input' : 'login-input';

  return (
    <div x-data="loginForm()" className={formClass}>
      {/* Section 1: Jouer en tant qu'invité */}
      <form id="guest-form" className="login-section" {...{ '@submit.prevent': 'playAsGuest()' }}>
        <h3 className="login-section-title">Jouer en tant qu'invité</h3>
        <div className="login-field">
          <input
            type="text"
            className={inputClass}
            x-model="guestUsername"
            placeholder="Pseudo"
            minLength={2}
            maxLength={20}
          />
          <p
            x-show="guestUsernameError"
            className="login-field-error"
            x-text="guestUsernameError"
          />
        </div>
        <button
          type="submit"
          className={buttonClass}
          {...{ ':disabled': 'loading' }}
        >
          <span x-show="!loading">Commencer à jouer</span>
          <span x-show="loading">Chargement...</span>
        </button>
      </form>

      <div className="login-divider">
        <span>ou</span>
      </div>

      {/* Section 2: S'inscrire / Se connecter */}
      <form id="auth-form" className="login-section" {...{ '@submit.prevent': 'sendMagicLink()' }}>
        <h3 className="login-section-title">S'inscrire / Se connecter</h3>
        <div className="login-field">
          <input
            type="email"
            className={inputClass}
            x-model="email"
            placeholder="Email"
          />
          <p
            x-show="emailError"
            className="login-field-error"
            x-text="emailError"
          />
        </div>
        <button
          type="submit"
          className={buttonClass}
          {...{ ':disabled': 'loading' }}
        >
          <span x-show="!loading">Recevoir un magic link</span>
          <span x-show="loading">Chargement...</span>
        </button>
        <p
          x-show="successMessage"
          x-cloak
          className="login-success"
          x-text="successMessage"
        />
      </form>

      {/* Global error */}
      <p x-show="error" className="login-error" x-text="error" />
    </div>
  );
}
