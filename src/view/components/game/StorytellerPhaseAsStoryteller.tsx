/** @jsx h */
import { h } from 'preact';
import type { StorytellingPhaseAsStorytellerView } from '../../view-models/game.view-model.js';
import { PlayerHand } from './GameHand.js';

interface StorytellerPhaseAsStorytellerProps {
  readonly view: StorytellingPhaseAsStorytellerView;
}

export function StorytellerPhaseAsStoryteller({
  view,
}: StorytellerPhaseAsStorytellerProps) {
  return (
    <div className="game-phase-layout">
      <div className="game-phase-layout__content">
        <div className="phase-instructions">
          <h2 className="phase-title">C'est ton tour !</h2>
          <p className="phase-description">
            Choisis une carte de ta main et donne un indice aux autres joueurs.
            L'indice peut être un mot, une phrase, un son, une chanson...
          </p>
        </div>
        <p className="hand-label">
          Clique sur une carte pour donner ton indice :
        </p>
      </div>

      <div className="game-phase-layout__hand">
        <PlayerHand
          hand={view.hand}
          renderModalContent={(cardId) => (
            <ClueForm cardId={cardId} action={view.action} />
          )}
        />
      </div>
    </div>
  );
}

interface ClueFormProps {
  readonly cardId: string;
  readonly action: StorytellingPhaseAsStorytellerView['action'];
}

function ClueForm({ cardId, action }: ClueFormProps) {
  return (
    <form
      hx-post={action.url}
      hx-target="#game-container"
      hx-swap="outerHTML"
      x-data="{ clue: '' }"
      className="modal-clue-form"
    >
      <input type="hidden" name="cardId" value={cardId} />

      <div className="form-group">
        <label htmlFor={`clue-input-${cardId}`} className="form-label">
          Ton indice :
        </label>
        <input
          id={`clue-input-${cardId}`}
          type="text"
          name="clue"
          x-model="clue"
          className="clue-input"
          placeholder="Entre ton indice ici..."
          autoComplete="off"
        />
      </div>

      <div className="modal-actions">
        <button
          type="button"
          className="btn btn-secondary"
          x-on:click="modalOpen = false"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          x-bind:disabled="!clue.trim()"
        >
          <SubmitIcon />
          {action.label}
        </button>
      </div>
    </form>
  );
}

function SubmitIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
    </svg>
  );
}
