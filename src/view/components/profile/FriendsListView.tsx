/** @jsx h */
import { h } from 'preact';
import type { ProfileFriend } from '../../view-models/profile.view-model.js';
import { ComingSoonPlaceholder } from './ComingSoonPlaceholder.js';
import { FriendListItem } from './FriendListItem.js';

export interface FriendsListViewProps {
  readonly friends: ReadonlyArray<ProfileFriend>;
  readonly searchResults: ReadonlyArray<ProfileFriend>;
  readonly comingSoon?: boolean | undefined;
}

function SearchIcon() {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FilterIcon() {
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
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function EditIcon() {
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
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function FriendsListView({
  friends,
  searchResults,
  comingSoon,
}: FriendsListViewProps) {
  if (comingSoon) {
    return (
      <ComingSoonPlaceholder
        title="Friends"
        description="Search and manage your friends list is coming soon!"
      />
    );
  }

  return (
    <div className="friends-view">
      <div className="friends-search-section">
        {/* Search Section */}
        <section className="friends-search-container">
          <h3 className="friends-section-title">Search for a friend</h3>
          <div className="friends-search-input-wrapper">
            <SearchIcon />
            <input
              type="text"
              placeholder="Insert the username"
              className="friends-search-input"
            />
            <button type="button" className="friends-filter-button">
              <FilterIcon />
            </button>
          </div>
        </section>

        {/* Search Results */}
        <div className="friends-search-results">
          {searchResults.map((user) => (
            <FriendListItem key={user.id} friend={user} variant="search" />
          ))}
        </div>
      </div>

      {/* Friend List */}
      <aside className="friends-list-section">
        <div className="friends-list-header">
          <h3 className="friends-section-title">Friend list</h3>
          <button type="button" className="friends-list-edit">
            <EditIcon />
          </button>
        </div>
        <div className="friends-list">
          {friends.map((friend) => (
            <FriendListItem key={friend.id} friend={friend} variant="manage" />
          ))}
        </div>
      </aside>
    </div>
  );
}
