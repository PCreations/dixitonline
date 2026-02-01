/** @jsx h */
import { h } from 'preact';
import type { ProfileViewModel } from '../../view-models/profile.view-model.js';
import { Menu } from '../Menu.js';
import { Stars } from '../Stars.js';
import { BadgesView } from './BadgesView.js';
import { FriendsListView } from './FriendsListView.js';
import { OverviewView } from './OverviewView.js';
import { ProfileHeader } from './ProfileHeader.js';
import { ProfileSidebar } from './ProfileSidebar.js';
import { SecurityView } from './SecurityView.js';

export interface ProfilePageProps {
  readonly vm: ProfileViewModel;
}

export function ProfilePage({ vm }: ProfilePageProps) {
  return (
    <div className="profile-page">
      <Menu />
      <Stars />

      <div className="profile-container" x-data="{ activeTab: 'overview' }">
        <ProfileSidebar username={vm.username} />

        <main className="profile-main">
          <ProfileHeader
            username={vm.username}
            avatarUrl={vm.avatarUrl}
            stats={vm.stats}
          />

          <div className="profile-content">
            {/* Overview View */}
            <div x-show="activeTab === 'overview'" x-cloak>
              <OverviewView
                earnedBadges={vm.earnedBadges}
                lastGames={vm.lastGames}
                friends={vm.friends}
              />
            </div>

            {/* Friends List View */}
            <div x-show="activeTab === 'friends'" x-cloak>
              <FriendsListView
                friends={vm.friends}
                searchResults={vm.searchResults}
              />
            </div>

            {/* Badges View */}
            <div x-show="activeTab === 'badges'" x-cloak>
              <BadgesView
                earnedBadges={vm.earnedBadges}
                allBadges={vm.allBadges}
                badgesInProgress={vm.badgesInProgress}
              />
            </div>

            {/* Security View */}
            <div x-show="activeTab === 'security'" x-cloak>
              <SecurityView />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
