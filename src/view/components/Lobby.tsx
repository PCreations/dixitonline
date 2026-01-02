/** @jsx h */
import { h } from "preact";
import type { LobbyViewModel } from "../view-models/lobby.view-model.js";
import { LobbyContent } from "./LobbyContent.js";
import { Logo } from "./Logo.js";
import { Menu } from "./Menu.js";
import { Stars } from "./Stars.js";

/**
 * Lobby page component with SSE support for real-time updates.
 * The LobbyContent is wrapped in an SSE container that listens for
 * playerJoined and playerLeft events.
 */
export function Lobby(vm: LobbyViewModel) {
  return (
    <div className="lobby-container">
      <Menu />
      <Stars />

      <div className="lobby-content-wrapper">
        <Logo variant="lobby" />

        {/* SSE container for real-time updates */}
        <div
          hx-ext="sse"
          sse-connect={`/game/${vm.gameId}/events`}
        >
          {/* LobbyContent has its own sse-swap attributes for self-replacement */}
          <LobbyContent {...vm} />

          {/* Hidden element that triggers redirect on gameStarted */}
          <div sse-swap="gameStarted" hx-swap="innerHTML" />
        </div>
      </div>
    </div>
  );
}
