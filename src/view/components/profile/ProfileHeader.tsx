/** @jsx h */
import { h } from 'preact';
import type { ProfileStats } from '../../view-models/profile.view-model.js';

export interface ProfileHeaderProps {
  readonly username: string;
  readonly avatarUrl?: string | undefined;
  readonly stats: ProfileStats;
}

function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function ProfileHeader({
  username,
  avatarUrl,
  stats,
}: ProfileHeaderProps) {
  return (
    <header className="profile-header">
      <div className="profile-header-user">
        <div className="profile-header-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} />
          ) : (
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="24" cy="24" r="23" stroke="white" stroke-width="2" />
              <circle cx="24" cy="18" r="7" fill="white" />
              <path
                d="M8 40C8 33.3726 13.3726 28 20 28H28C34.6274 28 40 33.3726 40 40"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          )}
        </div>
        <div className="profile-header-name">
          <span>{username}</span>
          <button type="button" className="profile-header-edit">
            <EditIcon />
          </button>
        </div>
      </div>

      <div className="profile-header-stats">
        <div className="profile-header-stat">
          <span className="profile-header-stat-label">Games winned:</span>
          <span className="profile-header-stat-value">{stats.gamesWon}</span>
        </div>
        <div className="profile-header-stat">
          <span className="profile-header-stat-label">Games played:</span>
          <span className="profile-header-stat-value">{stats.gamesPlayed}</span>
        </div>
        <div className="profile-header-stat">
          <span className="profile-header-stat-label">Badged earned:</span>
          <span className="profile-header-stat-value">
            {stats.badgesEarned}
          </span>
        </div>
      </div>
    </header>
  );
}
