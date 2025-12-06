/** @jsx h */
import { h } from 'preact';

interface LogoProps {
  variant?: 'home' | 'login';
}

export function Logo({ variant = 'home' }: LogoProps) {
  return (
    <div className={variant === 'home' ? 'logo-container' : 'login-logo-container'}>
      <h1 className="logo-text">TIXID</h1>
    </div>
  );
}
