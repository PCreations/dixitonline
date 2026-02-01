/** @jsx h */
import { h } from 'preact';
import type { ProfileBadge } from '../../view-models/profile.view-model.js';
import { BadgeCard } from './BadgeCard.js';
import { ComingSoonPlaceholder } from './ComingSoonPlaceholder.js';

export interface BadgesViewProps {
  readonly earnedBadges: ReadonlyArray<ProfileBadge>;
  readonly allBadges: ReadonlyArray<ProfileBadge>;
  readonly badgesInProgress: ReadonlyArray<ProfileBadge>;
  readonly comingSoon?: boolean | undefined;
}

export function BadgesView({
  earnedBadges,
  allBadges,
  badgesInProgress,
  comingSoon,
}: BadgesViewProps) {
  if (comingSoon) {
    return (
      <ComingSoonPlaceholder
        title="Badges"
        description="Your badge collection and progress tracking are coming soon!"
      />
    );
  }

  // Separate locked badges from all badges
  const lockedBadges = allBadges.filter((b) => !b.isUnlocked);

  return (
    <div className="badges-view">
      <div className="badges-main">
        {/* Earned Badges Section */}
        <section className="badges-section">
          <h3 className="badges-section-title">Your badges</h3>
          <div className="badges-grid">
            {earnedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} size="medium" />
            ))}
          </div>
        </section>

        {/* All Badges Section */}
        <section className="badges-section">
          <h3 className="badges-section-title">All badges</h3>
          <div className="badges-grid badges-grid--dense">
            {lockedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} size="medium" />
            ))}
          </div>
        </section>
      </div>

      {/* Unlocking Sidebar */}
      <aside className="badges-unlocking">
        <h3 className="badges-section-title">Unlocking</h3>
        <div className="badges-progress-list">
          {badgesInProgress.map((badge) => (
            <div key={badge.id} className="badge-progress-item">
              <div className="badge-progress-image">
                <BadgeCard badge={badge} size="small" showLock={false} />
              </div>
              <div className="badge-progress-info">
                <span className="badge-progress-name">{badge.name}</span>
                <span className="badge-progress-description">
                  {badge.description}
                </span>
                <div className="badge-progress-bar">
                  <div
                    className="badge-progress-fill"
                    style={{ width: `${badge.progress || 0}%` }}
                  />
                </div>
              </div>
              <span className="badge-progress-value">
                {badge.progress || 0}/3
              </span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
