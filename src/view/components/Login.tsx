/** @jsx h */
import { h } from 'preact';
import { Dune } from './Dune.js';
import { LoginForm } from './LoginForm.js';
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
          <LoginForm variant="page" />
        </div>
      </div>
    </div>
  );
}
