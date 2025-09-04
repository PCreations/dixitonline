/** @jsx h */
import { h } from 'preact';
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
