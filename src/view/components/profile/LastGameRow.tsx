/** @jsx h */
import { h } from 'preact';
import type { ProfileLastGame } from '../../view-models/profile.view-model.js';

export interface LastGameRowProps {
  readonly game: ProfileLastGame;
}

function MedalIcon({ position }: { position: number }) {
  // Gold for 1st, Silver for 2nd, Bronze for 3rd, default for others
  const colors: Record<number, string> = {
    1: '#FFD700',
    2: '#C0C0C0',
    3: '#CD7F32',
  };
  const color = colors[position] || '#888888';

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="9" r="6" fill={color} />
      <path d="M8 14L6 22L12 19L18 22L16 14" fill={color} opacity="0.7" />
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

export function LastGameRow({ game }: LastGameRowProps) {
  return (
    <div className="last-game-row">
      <div className="last-game-position">
        <MedalIcon position={game.position} />
      </div>
      <span className="last-game-place">{game.positionLabel}</span>
      <span className="last-game-points">{game.points} points</span>
      <span className="last-game-turns">{game.turns} turns total</span>
      <a href={game.leaderboardUrl} className="last-game-link">
        <span>Go to the leaderboard</span>
        <ArrowRightIcon />
      </a>
    </div>
  );
}
