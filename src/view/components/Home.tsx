/** @jsx h */
import { h } from 'preact';
import { AuthProvider } from './AuthProvider.js';
import { Button } from './Button.js';
import { Dune } from './Dune.js';
import { Logo } from './Logo.js';
import { Menu } from './Menu.js';
import { Moon } from './Moon.js';
import { SandSteps } from './SandSteps.js';
import { Stars } from './Stars.js';

export interface HomeProps {
  user?: {
    username: string;
  } | undefined;
}

export function Home({ user }: HomeProps) {
  return (
    <AuthProvider>
      <div className="home-container">
        <Menu />
        <Stars />
        <div className="moon-container">
          <Moon />
        </div>
        <Logo />
        <p className="journey-subtitle">
          {user ? `Enjoy your journey, ${user.username}` : 'Enjoy your journey'}
        </p>
        <div className="button-container">
          {user ? [
            <Button key="create" href="/game/new">Create a game</Button>,
            <Button key="join" href="/game/join">Join a game</Button>
          ] : (
            <Button href="/lobby">Start your adventure</Button>
          )}
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
    </AuthProvider>
  );
}
