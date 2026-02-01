/** @jsx h */
import { h } from 'preact';
import type { ProfileBadge } from '../../view-models/profile.view-model.js';

export interface BadgeCardProps {
  readonly badge: ProfileBadge;
  readonly size?: 'small' | 'medium' | 'large';
  readonly showLock?: boolean;
}

function LockIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function BadgeCard({
  badge,
  size = 'medium',
  showLock = true,
}: BadgeCardProps) {
  const sizeClass = `badge-card--${size}`;
  const lockedClass = !badge.isUnlocked ? 'badge-card--locked' : '';

  return (
    <div className={`badge-card ${sizeClass} ${lockedClass}`}>
      <div className="badge-card-hexagon">
        {/* Placeholder gradient background for badges */}
        <div className="badge-card-image">
          {/* Will be replaced with actual badge images */}
        </div>
        {!badge.isUnlocked && showLock && (
          <div className="badge-card-lock">
            <LockIcon />
          </div>
        )}
      </div>
      <span className="badge-card-name">{badge.name}</span>
    </div>
  );
}
