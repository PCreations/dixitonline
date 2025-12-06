/** @jsx h */
import { h } from 'preact';

interface ButtonProps {
  children: string;
  onClick?: () => void;
}

export function Button({ children, onClick }: ButtonProps) {
  return (
    <button className="adventure-button" onClick={onClick}>
      {children}
    </button>
  );
}
