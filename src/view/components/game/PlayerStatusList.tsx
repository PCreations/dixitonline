/** @jsx h */
import { h } from 'preact';
import type { PlayerStatus } from '../../view-models/game.view-model.js';

interface PlayerStatusListProps {
  readonly players: ReadonlyArray<PlayerStatus>;
}

export function PlayerStatusList({ players }: PlayerStatusListProps) {
  return (
    <div className="player-status-list">
      {players.map((ps) => (
        <div
          key={ps.player.id}
          className={`player-status-item ${ps.status === 'ready' ? 'player-status-ready' : 'player-status-waiting'}`}
        >
          <PlayerIcon />
          <span className="player-status-name">
            {ps.player.name}
            {ps.player.isCurrentPlayer && ' (toi)'}
          </span>
          <span className="player-status-indicator">
            {ps.status === 'ready' ? <CheckIcon /> : <WaitingIcon />}
          </span>
        </div>
      ))}
    </div>
  );
}

function PlayerIcon() {
  return (
    <svg
      className="player-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="status-icon status-icon-ready"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
        fill="currentColor"
      />
    </svg>
  );
}

function WaitingIcon() {
  return (
    <svg
      className="status-icon status-icon-waiting"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 4"
      />
    </svg>
  );
}
