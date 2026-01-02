import type { LobbyPlayer, LobbyState } from "../../game/lobby.query-service.js";

const MIN_PLAYERS_TO_START = 3;
const MAX_PLAYERS = 6;

export interface LobbyAction {
  readonly type: "start-game" | "copy-invite";
  readonly url: string;
  readonly method: "POST" | "GET";
  readonly label: string;
  readonly disabled: boolean;
}

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
 * No side effects - all values derived from inputs
 */
export function createLobbyViewModel(
  state: LobbyState,
  props: LobbyViewModelProps,
): LobbyViewModel {
  const { gameId, hostId, players } = state;
  const { currentPlayerId } = props;

  const isHost = hostId === currentPlayerId;
  const canStart = isHost && players.length >= MIN_PLAYERS_TO_START;
  const needsMore = Math.max(0, MIN_PLAYERS_TO_START - players.length);

  return {
    gameId,
    title: "Lobby",
    statusMessage: deriveStatusMessage({ canStart, needsMore, isHost }),
    playerCount: `${players.length}/${MAX_PLAYERS}`,
    players: derivePlayers(players, { currentPlayerId, hostId }),
    inviteUrl: `/game/${gameId}/join`,
    actions: deriveActions(gameId, { isHost, canStart }),
  };
}

// Pure helper functions

function deriveStatusMessage(flags: {
  canStart: boolean;
  needsMore: number;
  isHost: boolean;
}): string {
  if (flags.canStart) {
    return "Prêt à démarrer !";
  }

  if (flags.needsMore > 0) {
    const plural = flags.needsMore > 1 ? "s" : "";
    return `En attente de ${flags.needsMore} joueur${plural} minimum...`;
  }

  return "En attente de joueurs...";
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

function deriveActions(
  gameId: string,
  flags: { isHost: boolean; canStart: boolean },
): ReadonlyArray<LobbyAction> {
  const actions: LobbyAction[] = [];

  if (flags.isHost) {
    actions.push({
      type: "start-game",
      url: `/game/${gameId}/start`,
      method: "POST",
      label: "Lancer la partie",
      disabled: !flags.canStart,
    });
  }

  actions.push({
    type: "copy-invite",
    url: `/game/${gameId}/join`,
    method: "GET",
    label: "Copier le lien",
    disabled: false,
  });

  return actions;
}
