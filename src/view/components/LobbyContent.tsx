/** @jsx h */
import { h } from "preact";
import type {
  LobbyAction,
  LobbyViewModel,
} from "../view-models/lobby.view-model.js";
import { Button } from "./Button.js";

/**
 * LobbyContent - The dynamic part of the lobby that gets updated via SSE.
 * This component is rendered as a fragment for SSE updates.
 */
export function LobbyContent(vm: LobbyViewModel) {
  return (
    <div
      id="lobby-content"
      sse-swap="playerJoined, playerLeft"
      hx-swap="outerHTML"
    >
      <p className="lobby-status">{vm.statusMessage}</p>

      <div className="lobby-box">
        <div className="lobby-header">
          <div className="lobby-counter">{vm.playerCount}</div>
        </div>

        <div className="lobby-players">
          {vm.players.map((player) => (
            <div key={player.name} className="lobby-player">
              <PlayerIcon />
              <span className="lobby-player-name">
                {player.name}
                {player.isHost && " (Hôte)"}
              </span>
            </div>
          ))}
        </div>

        <div className="lobby-actions">
          <div className="lobby-invite-section">
            <span className="lobby-invite-label">Lien d'invitation :</span>
            <code className="lobby-invite-url">{vm.inviteUrl}</code>
          </div>

          {vm.actions.map((action) => (
            <LobbyActionButton key={action.type} action={action} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LobbyActionButton({ action }: { action: LobbyAction }) {
  if (action.type === "start-game") {
    return (
      <form action={action.url} method="POST">
        <Button type="submit" disabled={action.disabled}>
          <PlayIcon />
          {action.label}
        </Button>
      </form>
    );
  }

  return null;
}

function PlayerIcon() {
  return (
    <svg
      className="lobby-player-icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
        fill="white"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
      <path d="M0 0V14L12 7L0 0Z" fill="white" />
    </svg>
  );
}
