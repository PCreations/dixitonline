/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from 'preact';
import type { SelectingCardsAsGuesserView } from '../../view-models/game.view-model.js';
import { ClueDisplay } from './ClueDisplay.js';
import { PlayerHand } from './GameHand.js';

interface CardSelectionProps {
  readonly view: SelectingCardsAsGuesserView;
}

export function CardSelection({ view }: CardSelectionProps) {
  return (
    <>
      <div className="phase-description-container">
        <div className="phase-instructions">
          {view.hasSelectedCard ? (
            <>
              <h2 className="phase-title">Carte sélectionnée !</h2>
              <p className="phase-description">
                Ta carte a été sélectionnée. Les autres joueurs devront deviner quelle est la carte du conteur.
              </p>
            </>
          ) : (
            <>
              <h2 className="phase-title">Choisis une carte !</h2>
              <p className="phase-description">
                Sélectionne une carte de ta main qui correspond à l'indice. Les
                autres joueurs devront deviner quelle est la carte du conteur.
              </p>
            </>
          )}
        </div>
      
        <ClueDisplay clue={view.clue} storytellerName={view.storyteller.name} />
      </div>
      <PlayerHand
          hand={view.hand}
          renderModalContent={(cardId) => (
            <SelectCardForm cardId={cardId} action={view.action} />
          )}
        />
    </>
  )
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
