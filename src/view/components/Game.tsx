/** @jsx h */
/** @jsxFrag Fragment */
import { h } from 'preact';
import type { GamePlayerView } from '../view-models/game.view-model.js';
import {
  CardSelection,
  GameEnded,
  ScoringResults,
  StorytellerClueForm,
  VotingBoard,
  WaitingForPlayers,
  WaitingForStoryteller,
} from './game/index.js';
import { Menu } from './Menu.js';
import { Stars } from './Stars.js';

interface GameProps {
  readonly view: GamePlayerView;
}

/**
 * Main Game component - dispatches to phase-specific components based on view._tag
 */
export function Game({ view }: GameProps) {
  return (
    <div className="game-container">
      <Menu />
      <Stars />

      <div className="game-header">
        <GameInfo view={view} />
      </div>

      <div id="game-content" className="game-content">
        <GamePhaseContent view={view} />
      </div>
    </div>
  );
}

/**
 * Game info bar showing score, turn, and storyteller
 */
function GameInfo({ view }: { view: GamePlayerView }) {
  if (view._tag === 'Ended') {
    return (
      <div className="game-info">
        <div className="game-status">Partie terminée</div>
      </div>
    );
  }

  return (
    <div className="game-info">
      <div className="game-points">{view.score} points</div>
      <div className="game-status">
        <PhaseLabel phase={view._tag} />
      </div>
      <div className="game-turn">
        Tour {view.turnNumber}
        <StarIcon />
      </div>
    </div>
  );
}

/**
 * Phase-specific content - pattern matching on discriminated union
 */
function GamePhaseContent({ view }: { view: GamePlayerView }) {
  switch (view._tag) {
    case 'StorytellingAsStoryteller':
      return <StorytellerClueForm view={view} />;

    case 'StorytellingAsGuesser':
      return <WaitingForStoryteller view={view} />;

    case 'SelectingCardsAsStoryteller':
      return <WaitingForPlayers view={view} phase="selecting" />;

    case 'SelectingCardsAsGuesser':
      return <CardSelection view={view} />;

    case 'VotingAsStoryteller':
      return <WaitingForPlayers view={view} phase="voting" />;

    case 'VotingAsGuesser':
      return <VotingBoard view={view} />;

    case 'Scoring':
      return <ScoringResults view={view} />;

    case 'Ended':
      return <GameEnded view={view} />;
  }
}

function PhaseLabel({ phase }: { phase: GamePlayerView['_tag'] }) {
  const labels: Record<GamePlayerView['_tag'], string> = {
    StorytellingAsStoryteller: 'Ton tour - Donne un indice',
    StorytellingAsGuesser: 'En attente du conteur',
    SelectingCardsAsStoryteller: 'Sélection des cartes',
    SelectingCardsAsGuesser: 'Choisis une carte',
    VotingAsStoryteller: 'Phase de vote',
    VotingAsGuesser: 'Vote !',
    Scoring: 'Résultats',
    Ended: 'Terminé',
  };

  return <span>{labels[phase]}</span>;
}

function StarIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="game-turn-icon"
    >
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill="white"
        opacity="0.6"
      />
    </svg>
  );
}
