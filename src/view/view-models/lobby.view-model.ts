import { MAX_PLAYERS } from "../../game/game.entity.js";
import type { LobbyAction } from "../../game/game-view-projector.js";
import type { LobbyPlayer, LobbyState } from "../../game/lobby.query-service.js";

export interface LobbyPlayerViewModel {
  readonly name: string;
  readonly isCurrentUser: boolean;
  readonly isHost: boolean;
}

export interface LobbyViewModel {
  readonly gameId: string;
  readonly title: string;
  readonly statusMessage: string;
  readonly playerCount: string;
  readonly players: ReadonlyArray<LobbyPlayerViewModel>;
  readonly inviteUrl: string;
  readonly actions: ReadonlyArray<LobbyAction>;
}

export interface LobbyViewModelProps {
  readonly currentPlayerId: string;
}

/**
 * Pure view model function: output = f(state, props)
 * Formatting only - all business logic comes from state
 */
export function createLobbyViewModel(
  state: LobbyState,
  props: LobbyViewModelProps,
): LobbyViewModel {
  const { gameId, hostId, players, canStart, actions } = state;
  const { currentPlayerId } = props;

  return {
    gameId,
    title: "Lobby",
    statusMessage: canStart ? "Prêt à démarrer !" : "En attente de joueurs...",
    playerCount: `${players.length}/${MAX_PLAYERS}`,
    players: derivePlayers(players, { currentPlayerId, hostId }),
    inviteUrl: `/game/${gameId}/join`,
    actions,
  };
}

function derivePlayers(
  players: ReadonlyArray<LobbyPlayer>,
  context: { currentPlayerId: string; hostId: string },
): ReadonlyArray<LobbyPlayerViewModel> {
  return players.map((player) => ({
    name: player.username,
    isCurrentUser: player.id === context.currentPlayerId,
    isHost: player.id === context.hostId,
  }));
}
