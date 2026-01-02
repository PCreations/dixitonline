/** @jsx h */
import { h } from 'preact';
import { Dune } from './Dune.js';
import { Logo } from './Logo.js';
import { Menu } from './Menu.js';
import { Moon } from './Moon.js';
import { SandSteps } from './SandSteps.js';
import { Stars } from './Stars.js';

export function Login() {
  return (
    <div className="login-container">
      <Menu />
      <Stars />
      <div className="moon-container">
        <Moon />
      </div>
      <div className="dune-wrapper">
        <div className="dune-container">
          <Dune />
          <div className="sand-steps-container">
            <SandSteps />
          </div>
        </div>
      </div>
      <div className="login-panel">
        <div className="login-content">
          <Logo variant="login" />
          <p className="login-subtitle">Entrez votre pseudo pour commencer</p>
          <form
            className="login-form"
            x-data="loginForm()"
            {...{ '@submit.prevent': 'submit' }}
          >
            <div className="login-field">
              <label className="login-label" htmlFor="username">
                Pseudo
              </label>
              <input
                type="text"
                id="username"
                className="login-input"
                x-model="username"
                {...{ ':class': "{ 'login-input-error': submitted && !username }" }}
                required
              />
              <p
                x-show="submitted && !username"
                className="login-field-error"
              >
                Ce champ est requis
              </p>
            </div>
            <div className="login-field">
              <label className="login-label" htmlFor="email">
                Email <span className="login-optional">(optionnel)</span>
              </label>
              <input
                type="email"
                id="email"
                className="login-input"
                x-model="email"
                {...{ ':class': "{ 'login-input-error': emailError }" }}
              />
              <p x-show="emailError" className="login-field-error" x-text="emailError" />
            </div>
            <p x-show="error" className="login-error" x-text="error" />
            <button
              type="submit"
              className="login-button"
              {...{ ':disabled': 'loading' }}
            >
              <span x-show="!loading">Enter your adventure</span>
              <span x-show="loading">Chargement...</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
