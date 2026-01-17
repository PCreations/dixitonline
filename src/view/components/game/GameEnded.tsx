/** @jsx h */
import { h } from 'preact';
import type { EndedView } from '../../view-models/game.view-model.js';

interface GameEndedProps {
  readonly view: EndedView;
}

export function GameEnded({ view }: GameEndedProps) {
  const winner = view.rankings[0];
  const currentPlayerRank = view.rankings.find((r) => r.player.isCurrentPlayer);

  return (
    <div className="game-ended">
      <div className="phase-instructions">
        <h2 className="phase-title">Partie terminée !</h2>
        <p className="phase-description">
          {winner.player.isCurrentPlayer
            ? 'Félicitations, tu as gagné ! 🎉'
            : `${winner.player.name} remporte la partie !`}
        </p>
      </div>

      <div className="winner-section">
        <TrophyIcon />
        <div className="winner-info">
          <span className="winner-name">{winner.player.name}</span>
          <span className="winner-score">{winner.score} points</span>
        </div>
      </div>

      <div className="rankings-section">
        <h3 className="rankings-title">Classement final</h3>
        <div className="rankings-list">
          {view.rankings.map((r) => (
            <div
              key={r.player.id}
              className={`ranking-item ${r.player.isCurrentPlayer ? 'ranking-current' : ''} ${r.rank <= 3 ? `ranking-top-${r.rank}` : ''}`}
            >
              <span className="ranking-position">
                {r.rank === 1 && <GoldMedal />}
                {r.rank === 2 && <SilverMedal />}
                {r.rank === 3 && <BronzeMedal />}
                {r.rank > 3 && `#${r.rank}`}
              </span>
              <span className="ranking-name">
                {r.player.name}
                {r.player.isCurrentPlayer && ' (toi)'}
              </span>
              <span className="ranking-score">{r.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      {currentPlayerRank && !currentPlayerRank.player.isCurrentPlayer && (
        <div className="your-result">
          Tu as terminé #{currentPlayerRank.rank} avec {currentPlayerRank.score}{' '}
          points
        </div>
      )}

      <a href={view.action.url} className="btn btn-primary">
        <HomeIcon />
        {view.action.label}
      </a>
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg
      className="trophy-icon"
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"
        fill="currentColor"
      />
    </svg>
  );
}

function GoldMedal() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#FFD700" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fill="#000"
        fontSize="12"
        fontWeight="bold"
      >
        1
      </text>
    </svg>
  );
}

function SilverMedal() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#C0C0C0" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fill="#000"
        fontSize="12"
        fontWeight="bold"
      >
        2
      </text>
    </svg>
  );
}

function BronzeMedal() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#CD7F32" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fill="#000"
        fontSize="12"
        fontWeight="bold"
      >
        3
      </text>
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor" />
    </svg>
  );
}
