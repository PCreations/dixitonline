/** @jsx h */
import { h } from 'preact';
import type { StorytellingAsGuesserView } from '../../view-models/game.view-model.js';
import { Card } from '../Card.js';
import { PlayerStatusList } from './PlayerStatusList.js';

interface WaitingForStorytellerProps {
  readonly view: StorytellingAsGuesserView;
}

export function WaitingForStoryteller({ view }: WaitingForStorytellerProps) {
  return (
    <div className="waiting-for-storyteller">
      <div className="phase-instructions">
        <h2 className="phase-title">En attente...</h2>
        <p className="phase-description">
          {view.storyteller.name} choisit une carte et prépare son indice.
        </p>
      </div>

      <div className="waiting-animation">
        <WaitingSpinner />
      </div>

      <PlayerStatusList players={view.playersStatus} />

      <div className="hand-section">
        <p className="hand-label">Tes cartes :</p>
        <div className="cards-grid cards-preview">
          {view.hand.map((card) => (
            <Card key={card.id} id={card.id} url={card.url} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WaitingSpinner() {
  return (
    <svg
      className="waiting-spinner"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
