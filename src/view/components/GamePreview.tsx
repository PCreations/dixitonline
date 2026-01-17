/** @jsx h */
import { h } from 'preact';
import { Card } from './Card.js';
import { Menu } from './Menu.js';
import { Stars } from './Stars.js';

interface CardView {
  readonly id: string;
  readonly url: string;
}

interface GamePreviewProps {
  points?: number;
  turn?: number;
  status?: string;
  showCardSelection?: boolean;
  cards?: ReadonlyArray<CardView>;
}

/**
 * Simple game preview component for testing the card fan layout.
 * This is the original Game component before the phase-based refactor.
 */
export function GamePreview({
  points = 2,
  turn = 3,
  status = 'Waiting for the storyteller...',
  showCardSelection = true,
  cards,
}: GamePreviewProps) {
  return (
    <div className="game-container">
      <Menu />
      <Stars />

      <div className="game-info">
        <div className="game-points">{points} points</div>
        <div className="game-status">{status}</div>
        <div className="game-turn">
          Turn {turn}
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
        </div>
      </div>

      {showCardSelection && (
        <div className="game-cards">
          {cards && cards.length > 0
            ? cards.map((card) => (
                <Card key={card.id} id={card.id} url={card.url} />
              ))
            : Array.from({ length: 5 }, (_, i) => <Card key={i} />)}
        </div>
      )}
    </div>
  );
}
