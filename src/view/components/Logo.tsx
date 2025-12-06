/** @jsx h */
import { h } from 'preact';

interface LogoProps {
  variant?: 'home' | 'login' | 'lobby';
}

export function Logo({ variant = 'home' }: LogoProps) {
  const className =
    variant === 'home' ? 'logo-container' :
    variant === 'login' ? 'login-logo-container' :
    'lobby-logo-container';

  return (
    <div className={className}>
      <h1 className="logo-text">TIXID</h1>
    </div>
  );
}
