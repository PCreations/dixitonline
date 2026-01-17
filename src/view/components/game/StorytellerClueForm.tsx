/** @jsx h */
import { h } from 'preact';
import type { StorytellingAsStorytellerView } from '../../view-models/game.view-model.js';
import { Card } from '../Card.js';

interface StorytellerClueFormProps {
  readonly view: StorytellingAsStorytellerView;
}

export function StorytellerClueForm({ view }: StorytellerClueFormProps) {
  return (
    <div className="storyteller-clue-form">
      <div className="phase-instructions">
        <h2 className="phase-title">C'est ton tour !</h2>
        <p className="phase-description">
          Choisis une carte de ta main et donne un indice aux autres joueurs.
          L'indice peut-etre un mot, une phrase, un son, une chanson...
        </p>
      </div>

      <form
        hx-post={view.action.url}
        hx-target="#game-content"
        hx-swap="innerHTML"
        x-data="{ selectedCard: null, clue: '' }"
        className="clue-form"
      >
        <div className="form-group">
          <label htmlFor="clue-input" className="form-label">
            Ton indice :
          </label>
          <input
            id="clue-input"
            type="text"
            name="clue"
            x-model="clue"
            className="clue-input"
            placeholder="Entre ton indice ici..."
            autoComplete="off"
          />
        </div>

        <input type="hidden" name="cardId" x-bind:value="selectedCard" />

        <div className="hand-cards">
          <p className="hand-label">Choisis une carte :</p>
          <div className="cards-grid">
            {view.hand.map((card) => (
              <div
                key={card.id}
                className="card-selectable"
                x-on:click={`selectedCard = '${card.id}'`}
                x-bind:class={`selectedCard === '${card.id}' ? 'card-selected' : ''`}
              >
                <Card id={card.id} url={card.url} />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          x-bind:disabled="!selectedCard || !clue.trim()"
        >
          <SubmitIcon />
          {view.action.label}
        </button>
      </form>
    </div>
  );
}

function SubmitIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
    </svg>
  );
}
