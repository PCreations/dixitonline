/** @jsx h */
import { h } from 'preact';

export interface ProfileSidebarProps {
  readonly username: string;
}

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ChevronDownIcon() {
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ProfileSidebar({ username }: ProfileSidebarProps) {
  return (
    <aside className="profile-sidebar">
      <div className="profile-sidebar-nav">
        {/* Profile Section */}
        <div className="profile-sidebar-section">
          <h3 className="profile-sidebar-section-title">Profile</h3>

          <button
            type="button"
            className="profile-sidebar-link"
            x-bind:class="activeTab === 'overview' && 'profile-sidebar-link--active'"
            x-on:click="activeTab = 'overview'"
          >
            <HomeIcon />
            <span>Overview</span>
            <ChevronDownIcon />
          </button>

          <button
            type="button"
            className="profile-sidebar-link"
            x-bind:class="activeTab === 'friends' && 'profile-sidebar-link--active'"
            x-on:click="activeTab = 'friends'"
          >
            <UsersIcon />
            <span>Your friends list</span>
          </button>

          <button
            type="button"
            className="profile-sidebar-link"
            x-bind:class="activeTab === 'badges' && 'profile-sidebar-link--active'"
            x-on:click="activeTab = 'badges'"
          >
            <AwardIcon />
            <span>Your badges</span>
          </button>
        </div>

        {/* Settings Section */}
        <div className="profile-sidebar-section">
          <h3 className="profile-sidebar-section-title">Settings</h3>

          <button
            type="button"
            className="profile-sidebar-link"
            x-bind:class="activeTab === 'security' && 'profile-sidebar-link--active'"
            x-on:click="activeTab = 'security'"
          >
            <SettingsIcon />
            <span>Profile & Security</span>
          </button>
        </div>
      </div>

      {/* User at bottom */}
      <div className="profile-sidebar-user">
        <div className="profile-sidebar-user-avatar">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="16" cy="16" r="15" stroke="white" stroke-width="2" />
            <circle cx="16" cy="12" r="5" fill="white" />
            <path
              d="M6 26C6 21.5817 9.58172 18 14 18H18C22.4183 18 26 21.5817 26 26"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <span className="profile-sidebar-user-name">{username}</span>
        <a href="/" className="profile-sidebar-back">
          <BackArrowIcon />
        </a>
      </div>
    </aside>
  );
}
