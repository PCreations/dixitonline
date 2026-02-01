/** @jsx h */
import { h } from 'preact';
import type {
  ProfileBadge,
  ProfileFriend,
  ProfileLastGame,
} from '../../view-models/profile.view-model.js';
import { BadgeCard } from './BadgeCard.js';
import { FriendListItem } from './FriendListItem.js';
import { LastGameRow } from './LastGameRow.js';

export interface OverviewViewProps {
  readonly earnedBadges: ReadonlyArray<ProfileBadge>;
  readonly lastGames: ReadonlyArray<ProfileLastGame>;
  readonly friends: ReadonlyArray<ProfileFriend>;
}

function ArrowRightIcon() {
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
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
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

export function OverviewView({
  earnedBadges,
  lastGames,
  friends,
}: OverviewViewProps) {
  // Show max 6 badges in overview
  const displayBadges = earnedBadges.slice(0, 6);
  // Show max 6 games in overview
  const displayGames = lastGames.slice(0, 6);

  return (
    <div className="overview-view">
      <div className="overview-main">
        {/* Badges Section */}
        <section className="overview-section">
          <h3 className="overview-section-title">Your badges</h3>
          <div className="overview-badges">
            {displayBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} size="small" />
            ))}
          </div>
          <button
            type="button"
            className="overview-link"
            x-on:click="activeTab = 'badges'"
          >
            <span>Undiscovered badges</span>
            <ArrowRightIcon />
          </button>
        </section>

        {/* Last Games Section */}
        <section className="overview-section">
          <div className="overview-section-header">
            <h3 className="overview-section-title">Last games</h3>
            <select className="overview-filter">
              <option>All time</option>
              <option>This month</option>
              <option>This week</option>
            </select>
          </div>
          <div className="overview-games">
            {displayGames.map((game) => (
              <LastGameRow key={game.id} game={game} />
            ))}
          </div>
        </section>
      </div>

      {/* Friends Sidebar */}
      <aside className="overview-friends">
        <div className="overview-friends-header">
          <h3 className="overview-section-title">Friend list</h3>
          <button type="button" className="overview-friends-edit">
            <EditIcon />
          </button>
        </div>
        <div className="overview-friends-list">
          {friends.map((friend) => (
            <FriendListItem
              key={friend.id}
              friend={friend}
              variant="overview"
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
