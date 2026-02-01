/** @jsx h */
import { Fragment, h } from 'preact';
import type { ProfileFriend } from '../../view-models/profile.view-model.js';

export interface FriendListItemProps {
  readonly friend: ProfileFriend;
  readonly variant: 'overview' | 'search' | 'manage';
}

function AddIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function RemoveIcon() {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" />
      <line x1="23" y1="8" x2="18" y2="13" />
    </svg>
  );
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

function ArrowRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function FriendListItem({ friend, variant }: FriendListItemProps) {
  const statusClass = friend.isOnline
    ? 'friend-status--online'
    : 'friend-status--offline';

  return (
    <div className={`friend-item friend-item--${variant}`}>
      <div className="friend-item-avatar">
        {friend.avatarUrl ? (
          <img src={friend.avatarUrl} alt={friend.username} />
        ) : (
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
        )}
      </div>

      <div className="friend-item-info">
        <span className="friend-item-name">{friend.username}</span>
        <span className={`friend-item-status ${statusClass}`}>
          <span className="friend-status-dot" />
          {friend.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="friend-item-actions">
        {variant === 'overview' && (
          <button type="button" className="friend-action-link">
            <span>Invite to a game</span>
            <ArrowRightIcon />
          </button>
        )}

        {variant === 'search' && (
          <button type="button" className="friend-action-button">
            <AddIcon />
          </button>
        )}

        {variant === 'manage' && (
          <Fragment>
            <button type="button" className="friend-action-button">
              <RemoveIcon />
            </button>
            <button type="button" className="friend-action-button">
              <EditIcon />
            </button>
          </Fragment>
        )}
      </div>
    </div>
  );
}
