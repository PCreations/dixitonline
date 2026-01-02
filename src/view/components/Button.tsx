/** @jsx h */
import type { ComponentChildren } from 'preact';
import { h } from 'preact';

interface ButtonProps {
  children: ComponentChildren;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  href,
  type,
  disabled,
}: ButtonProps) {
  if (href) {
    return (
      <a href={href} className="adventure-button">
        {children}
      </a>
    );
  }

  return (
    <button
      className="adventure-button"
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
