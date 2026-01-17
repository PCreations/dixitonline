/** @jsx h */
import { h } from 'preact';
import type { SelectingCardsAsGuesserView } from '../../view-models/game.view-model.js';
import { Card } from '../Card.js';
import { ClueDisplay } from './ClueDisplay.js';
import { PlayerStatusList } from './PlayerStatusList.js';

interface CardSelectionProps {
  readonly view: SelectingCardsAsGuesserView;
}

export function CardSelection({ view }: CardSelectionProps) {
  if (view.hasSelectedCard) {
    return (
      <div className="card-selection card-selection-done">
        <div className="phase-instructions">
          <h2 className="phase-title">Carte sélectionnée !</h2>
          <p className="phase-description">En attente des autres joueurs...</p>
        </div>

        <ClueDisplay clue={view.clue} storytellerName={view.storyteller.name} />

        <PlayerStatusList players={view.playersStatus} />
      </div>
    );
  }

  return (
    <div className="card-selection">
      <div className="phase-instructions">
        <h2 className="phase-title">Choisis une carte !</h2>
        <p className="phase-description">
          Sélectionne une carte de ta main qui correspond à l'indice. Les autres
          joueurs devront deviner quelle est la carte du conteur.
        </p>
      </div>

      <ClueDisplay clue={view.clue} storytellerName={view.storyteller.name} />

      <form
        hx-post={view.action.url}
        hx-target="#game-content"
        hx-swap="innerHTML"
        x-data="{ selectedCard: null }"
        className="card-selection-form"
      >
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
          x-bind:disabled="!selectedCard"
        >
          <SelectIcon />
          {view.action.label}
        </button>
      </form>

      <PlayerStatusList players={view.playersStatus} />
    </div>
  );
}

function SelectIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
        fill="currentColor"
      />
    </svg>
  );
}
