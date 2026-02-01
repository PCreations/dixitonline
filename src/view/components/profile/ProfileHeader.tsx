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

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Editable username component with inline form.
 * Uses Alpine.js for state management.
 * Flow: Server validates uniqueness & updates DB -> Supabase Auth updates user_metadata -> Session refresh
 */
export function ProfileHeaderName({ username }: { username: string }) {
  // Alpine.js component definition as a string to avoid JSX escaping issues
  const alpineData = `{
    editing: false,
    error: '',
    loading: false,
    username: '${username.replace(/'/g, "\\'")}',
    async updateUsername() {
      const input = this.$refs.usernameInput;
      const newUsername = input.value.trim();

      if (newUsername.length < 2 || newUsername.length > 20) {
        this.error = 'Le pseudo doit contenir entre 2 et 20 caractères';
        return;
      }

      if (newUsername === this.username) {
        this.editing = false;
        return;
      }

      this.loading = true;
      this.error = '';

      try {
        // Step 1: Validate uniqueness and update database via server
        const response = await fetch('/profile/username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: newUsername })
        });

        const result = await response.json();

        if (!response.ok) {
          this.error = result.message || 'Erreur lors de la mise à jour';
          return;
        }

        // Step 2: Update Supabase Auth user_metadata (source of truth for JWT)
        const { error } = await window.supabase.auth.updateUser({
          data: { username: newUsername }
        });

        if (error) {
          this.error = error.message;
          return;
        }

        // Step 3: Refresh session to get updated JWT with new username and update cookie
        const { data: { session } } = await window.supabase.auth.refreshSession();
        if (session) {
          setAuthCookie(session.access_token);
        }

        this.username = newUsername;
        this.editing = false;
      } catch (e) {
        this.error = 'Erreur lors de la mise à jour';
      } finally {
        this.loading = false;
      }
    }
  }`;

  return (
    <div x-data={alpineData} className="profile-header-name">
      {/* Display mode */}
      <template x-if="!editing">
        <div className="profile-header-name-display">
          <span x-text="username">{username}</span>
          <button
            type="button"
            className="profile-header-edit"
            {...{
              '@click':
                "editing = true; error = ''; $nextTick(() => $refs.usernameInput.focus())",
            }}
          >
            <EditIcon />
          </button>
        </div>
      </template>

      {/* Edit mode */}
      <template x-if="editing">
        <form
          className="profile-header-name-form"
          {...{ '@submit.prevent': 'updateUsername()' }}
        >
          <input
            type="text"
            x-ref="usernameInput"
            {...{ ':value': 'username' }}
            className="profile-username-input"
            minLength={2}
            maxLength={20}
            required
            {...{ ':disabled': 'loading' }}
          />
          <button
            type="submit"
            className="profile-username-save"
            {...{ ':disabled': 'loading' }}
          >
            <CheckIcon />
          </button>
          <button
            type="button"
            className="profile-username-cancel"
            {...{ '@click': 'editing = false', ':disabled': 'loading' }}
          >
            <CloseIcon />
          </button>
          <p x-show="error" className="profile-username-error" x-text="error" />
        </form>
      </template>
    </div>
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
        <ProfileHeaderName username={username} />
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
