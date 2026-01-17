/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from 'preact';
import type { SelectingCardsAsGuesserView } from '../../view-models/game.view-model.js';
import { Card } from '../Card.js';
import { ClueDisplay } from './ClueDisplay.js';

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
      </div>
    );
  }

  return (
    <>
      <div className="card-selection">
        <div className="phase-instructions">
          <h2 className="phase-title">Choisis une carte !</h2>
          <p className="phase-description">
            Sélectionne une carte de ta main qui correspond à l'indice. Les
            autres joueurs devront deviner quelle est la carte du conteur.
          </p>
        </div>

        <ClueDisplay clue={view.clue} storytellerName={view.storyteller.name} />

        <p className="hand-label">Clique sur une carte pour la choisir :</p>
      </div>

      <div className="game-cards">
        {view.hand.map((card, index) => (
          <Card
            key={card.id}
            id={card.id}
            url={card.url}
            index={index}
            total={view.hand.length}
            modalContent={
              <SelectCardForm cardId={card.id} action={view.action} />
            }
          />
        ))}
      </div>
    </>
  );
}

interface SelectCardFormProps {
  readonly cardId: string;
  readonly action: SelectingCardsAsGuesserView['action'];
}

function SelectCardForm({ cardId, action }: SelectCardFormProps) {
  return (
    <form
      hx-post={action.url}
      hx-target="#game-content"
      hx-swap="innerHTML"
      className="modal-select-form"
    >
      <input type="hidden" name="cardId" value={cardId} />

      <div className="modal-actions">
        <button
          type="button"
          className="btn btn-secondary"
          x-on:click="modalOpen = false"
        >
          Annuler
        </button>
        <button type="submit" className="btn btn-primary">
          <SelectIcon />
          {action.label}
        </button>
      </div>
    </form>
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
