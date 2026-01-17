import type {
  CardView,
  EndedView,
  GamePlayerView,
  HtmxAction,
  PlayerInfo,
  PlayerStatus,
  PointEarned,
  ScoringView,
  SelectingCardsAsGuesserView,
  SelectingCardsAsStorytellerView,
  StorytellingAsGuesserView,
  StorytellingAsStorytellerView,
  VotingAsGuesserView,
  VotingAsStorytellerView,
} from '../../game/game.query-service.js';

// Re-export types from query service for use in components
export type {
  CardView,
  EndedView,
  GamePlayerView,
  HtmxAction,
  PlayerInfo,
  PlayerStatus,
  PointEarned,
  ScoringView,
  SelectingCardsAsGuesserView,
  SelectingCardsAsStorytellerView,
  StorytellingAsGuesserView,
  StorytellingAsStorytellerView,
  VotingAsGuesserView,
  VotingAsStorytellerView,
};

// === View Model Props ===
export interface GameViewModelProps {
  readonly currentPlayerId: string;
}

// === Derived View Model ===
export interface GameViewModel {
  readonly gameId: string;
  readonly currentPlayerName: string;
  readonly isStoryteller: boolean;
  readonly phase: GamePlayerView['_tag'];
  readonly statusMessage: string;
  readonly view: GamePlayerView;
}

/**
 * Pure view model function: output = f(state, props)
 * Derives display-ready data from the game state.
 */
export function createGameViewModel(
  state: GamePlayerView,
  _props: GameViewModelProps,
): GameViewModel {
  return {
    gameId: getGameId(state),
    currentPlayerName: state.currentPlayer.name,
    isStoryteller: isStoryteller(state),
    phase: state._tag,
    statusMessage: getStatusMessage(state),
    view: state,
  };
}

// === Helper Functions ===

function getGameId(state: GamePlayerView): string {
  if (state._tag === 'Ended') {
    return state.gameId;
  }
  return state.gameId;
}

function isStoryteller(state: GamePlayerView): boolean {
  switch (state._tag) {
    case 'StorytellingAsStoryteller':
    case 'SelectingCardsAsStoryteller':
    case 'VotingAsStoryteller':
      return true;
    case 'StorytellingAsGuesser':
    case 'SelectingCardsAsGuesser':
    case 'VotingAsGuesser':
    case 'Scoring':
    case 'Ended':
      return false;
  }
}

function getStatusMessage(state: GamePlayerView): string {
  switch (state._tag) {
    case 'StorytellingAsStoryteller':
      return "C'est ton tour ! Choisis une carte et donne un indice.";
    case 'StorytellingAsGuesser':
      return `En attente de l'indice de ${state.storyteller.name}...`;
    case 'SelectingCardsAsStoryteller':
      return 'Les joueurs choisissent leurs cartes...';
    case 'SelectingCardsAsGuesser':
      return state.hasSelectedCard
        ? 'En attente des autres joueurs...'
        : `Choisis une carte qui correspond à l'indice "${state.clue}"`;
    case 'VotingAsStoryteller':
      return 'Les joueurs votent...';
    case 'VotingAsGuesser':
      return state.hasVoted
        ? 'En attente des autres votes...'
        : 'Vote pour la carte du conteur !';
    case 'Scoring':
      return 'Résultats du tour';
    case 'Ended':
      return 'Partie terminée !';
  }
}

// === Type Guards ===

export function isStorytellingPhase(
  view: GamePlayerView,
): view is StorytellingAsStorytellerView | StorytellingAsGuesserView {
  return (
    view._tag === 'StorytellingAsStoryteller' ||
    view._tag === 'StorytellingAsGuesser'
  );
}

export function isSelectingCardsPhase(
  view: GamePlayerView,
): view is SelectingCardsAsStorytellerView | SelectingCardsAsGuesserView {
  return (
    view._tag === 'SelectingCardsAsStoryteller' ||
    view._tag === 'SelectingCardsAsGuesser'
  );
}

export function isVotingPhase(
  view: GamePlayerView,
): view is VotingAsStorytellerView | VotingAsGuesserView {
  return view._tag === 'VotingAsStoryteller' || view._tag === 'VotingAsGuesser';
}

export function isScoringPhase(view: GamePlayerView): view is ScoringView {
  return view._tag === 'Scoring';
}

export function isEndedPhase(view: GamePlayerView): view is EndedView {
  return view._tag === 'Ended';
}
