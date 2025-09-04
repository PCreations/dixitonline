/** @jsx h */
import { h } from 'preact';
import { Dune } from './Dune.js';
import { SandSteps } from './SandSteps.js';
import { Logo } from './Logo.js';

export function Home() {
  return (
    <div className="home-container">
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