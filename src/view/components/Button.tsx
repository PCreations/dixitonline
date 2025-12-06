/** @jsx h */
import { h } from 'preact';

interface ButtonProps {
  children: string;
  onClick?: () => void;
  href?: string;
}

export function Button({ children, onClick, href }: ButtonProps) {
  if (href) {
    return (
      <a href={href} className="adventure-button">
        {children}
      </a>
    );
  }

  return (
    <button className="adventure-button" onClick={onClick}>
      {children}
    </button>
  );
}
