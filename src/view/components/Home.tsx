/** @jsx h */
import { h } from 'preact';
import { Button } from './Button.js';
import { Dune } from './Dune.js';
import { Logo } from './Logo.js';
import { Menu } from './Menu.js';
import { Moon } from './Moon.js';
import { SandSteps } from './SandSteps.js';
import { Stars } from './Stars.js';

export function Home() {
  return (
    <div className="home-container">
      <Menu />
      <Stars />
      <div className="moon-container">
        <Moon />
      </div>
      <Logo />
      <p className="journey-subtitle">Enjoy your journey</p>
      <div className="button-container">
        <Button href="/login">Start you adventure</Button>
      </div>
      <div className="dune-wrapper">
        <div className="dune-container">
          <Dune />
          <div className="sand-steps-container">
            <SandSteps />
          </div>
        </div>
      </div>
    </div>
  );
}
