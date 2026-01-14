/** @jsx h */
import { h } from 'preact';

/**
 * Auth callback page for magic link redirect.
 *
 * Uses Alpine.js authCallback() store which:
 * - Checks if user has a username in metadata
 * - If yes: redirects to home
 * - If no: shows username form, then redirects
 */
export function AuthCallback() {
  return (
    <div
      className="auth-callback-container"
      x-data="authCallback()"
      x-init="init()"
    >
      {/* Loading state */}
      <div x-show="loading" className="auth-callback-loading">
        <div className="auth-callback-spinner" />
        <p>Connexion en cours...</p>
      </div>

      {/* Username form for new users */}
      <div
        x-show="needsUsername && !loading"
        x-cloak
        className="auth-callback-form"
      >
        <h2 className="auth-callback-title">Bienvenue !</h2>
        <p className="auth-callback-subtitle">
          Choisissez un pseudo pour continuer
        </p>

        <div className="auth-callback-field">
          <input
            type="text"
            x-model="username"
            placeholder="Pseudo"
            minLength={2}
            maxLength={20}
            className="auth-callback-input"
          />
          <p
            x-show="usernameError"
            className="auth-callback-field-error"
            x-text="usernameError"
          />
        </div>

        <button
          type="button"
          className="auth-callback-button"
          {...{ '@click': 'setUsername()' }}
          {...{ ':disabled': 'loading' }}
        >
          <span x-show="!loading">Continuer</span>
          <span x-show="loading">Chargement...</span>
        </button>

        <p x-show="error" className="auth-callback-error" x-text="error" />
      </div>

      {/* Error state */}
      <div
        x-show="error && !needsUsername && !loading"
        x-cloak
        className="auth-callback-error-container"
      >
        <p className="auth-callback-error" x-text="error" />
        <a href="/" className="auth-callback-link">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
