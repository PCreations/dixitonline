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
          <p className="login-subtitle">Log in using your account</p>
          <form className="login-form">
            <div className="login-field">
              <label className="login-label" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="login-input"
                placeholder=""
              />
            </div>
            <button type="submit" className="login-button">
              Enter your adventure
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
