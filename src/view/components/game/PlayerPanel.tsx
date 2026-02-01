/** @jsx h */
import { h } from 'preact';
import type {
  PlayerInfo,
  PlayerStatus,
} from '../../view-models/game.view-model.js';

interface PlayerPanelProps {
  readonly players: ReadonlyArray<PlayerStatus>;
  readonly storyteller: PlayerInfo;
}

export function PlayerPanel({ players, storyteller }: PlayerPanelProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <aside className="player-panel">
      <ul className="player-panel-list">
        {sortedPlayers.map((ps) => (
          <PlayerPanelItem
            key={ps.player.id}
            playerStatus={ps}
            isStoryteller={ps.player.id === storyteller.id}
          />
        ))}
      </ul>
    </aside>
  );
}

interface PlayerPanelItemProps {
  readonly playerStatus: PlayerStatus;
  readonly isStoryteller: boolean;
}

function PlayerPanelItem({
  playerStatus,
  isStoryteller,
}: PlayerPanelItemProps) {
  const { player, status, score } = playerStatus;

  const classes = [
    'player-panel-item',
    status === 'ready' ? 'player-panel-item--ready' : '',
    isStoryteller ? 'player-panel-item--storyteller' : '',
    player.isCurrentPlayer ? 'player-panel-item--current' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={classes}>
      <div className="player-panel-avatar">
        <PlayerIcon />
        {isStoryteller && <StorytellerBadge />}
      </div>
      <div className="player-panel-info">
        <span className="player-panel-name">
          {player.name}
          {player.isCurrentPlayer && ' (toi)'}
        </span>
        <span className="player-panel-score">{score} pts</span>
      </div>
      <div className="player-panel-status">
        {status === 'ready' ? <CheckIcon /> : <WaitingIcon />}
      </div>
    </li>
  );
}

function PlayerIcon() {
  return (
    <svg
      className="player-panel-icon"
      width="24"
      height="24"
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
      className="player-panel-status-icon"
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
      className="player-panel-status-icon"
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

function StorytellerBadge() {
  return (
    <div className="storyteller-badge">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill="white"
        />
      </svg>
    </div>
  );
}
