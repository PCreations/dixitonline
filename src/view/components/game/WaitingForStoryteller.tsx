/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from 'preact';
import type { StorytellingAsGuesserView } from '../../view-models/game.view-model.js';
import { PlayerHand } from './GameHand.js';


interface WaitingForStorytellerProps {
  readonly view: StorytellingAsGuesserView;
}

export function WaitingForStoryteller({ view }: WaitingForStorytellerProps) {
  return (
    <>
      <div className="phase-description-container">
        <div className="phase-instructions">
          <h2 className="phase-title">En attente du conteur...</h2>
          <p className="phase-description">
            {view.storyteller.name} est en train de choisir une carte et de
            préparer son indice.
          </p>
        </div>

        <div className="waiting-animation">
          <WaitingSpinner />
        </div>
      </div>

      <PlayerHand hand={view.hand} renderModalContent={() => <></>} />
    </>
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
