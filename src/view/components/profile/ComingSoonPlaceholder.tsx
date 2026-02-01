/** @jsx h */
import { h } from 'preact';

export interface ComingSoonPlaceholderProps {
  readonly title: string;
  readonly description?: string;
}

function ClockIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="coming-soon__icon-svg"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function ComingSoonPlaceholder({
  title,
  description,
}: ComingSoonPlaceholderProps) {
  return (
    <div className="coming-soon">
      <div className="coming-soon__icon">
        <ClockIcon />
      </div>
      <h3 className="coming-soon__title">{title}</h3>
      {description && <p className="coming-soon__description">{description}</p>}
      <span className="coming-soon__badge">Coming Soon</span>
    </div>
  );
}
