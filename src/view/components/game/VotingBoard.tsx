/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from 'preact';
import type { VotingAsGuesserView } from '../../view-models/game.view-model.js';
import { Card } from '../Card.js';
import { ClueDisplay } from './ClueDisplay.js';
import { PlayerHand } from './GameHand.js';

interface VotingBoardProps {
  readonly view: VotingAsGuesserView;
}

export function VotingBoard({ view }: VotingBoardProps) {
  return (
    <div className="game-phase-layout">
      <div className="game-phase-layout__content">
        <div className="phase-instructions">
          {view.hasVoted ? (
            <>
              <h2 className="phase-title">Vote enregistré !</h2>
              <p className="phase-description">
                En attente des autres joueurs...
              </p>
            </>
          ) : (
            <>
              <h2 className="phase-title">Vote !</h2>
              <p className="phase-description">
                Trouve la carte du conteur parmi toutes les cartes.
              </p>
            </>
          )}
        </div>

        <ClueDisplay clue={view.clue} storytellerName={view.storyteller.name} />

        <div className="board-cards-container">
          {view.boardCards.map((card) => {
            const isOwnCard = card.id === view.ownCardId;
            return (
              <Card
                key={card.id}
                id={card.id}
                url={card.url}
                size="small"
                modalContent={
                  isOwnCard ? (
                    <OwnCardModal />
                  ) : (
                    <VoteCardForm cardId={card.id} action={view.action} />
                  )
                }
              />
            );
          })}
        </div>
      </div>

      <div className="game-phase-layout__hand">
        <PlayerHand hand={view.hand} renderModalContent={() => <></>} />
      </div>
    </div>
  );
}

function OwnCardModal() {
  return (
    <div className="own-card-message">
      <p>C'est ta carte ! Tu ne peux pas voter pour elle.</p>
      <button
        type="button"
        className="btn btn-secondary"
        x-on:click="modalOpen = false"
      >
        Fermer
      </button>
    </div>
  );
}

interface VoteCardFormProps {
  readonly cardId: string;
  readonly action: VotingAsGuesserView['action'];
}

function VoteCardForm({ cardId, action }: VoteCardFormProps) {
  return (
    <form
      hx-post={action.url}
      hx-target="#game-container"
      hx-swap="outerHTML"
      className="modal-vote-form"
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
          <VoteIcon />
          {action.label}
        </button>
      </div>
    </form>
  );
}

function VoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 13h-.68l-2 2h1.91L19 17H5l1.78-2h2.05l-2-2H6l-3 3v4c0 1.1.89 2 1.99 2H19a2 2 0 002-2v-4l-3-3zm-1-5.05l-4.95 4.95-3.54-3.54 4.95-4.95L17 7.95zm-4.24-5.66L6.39 8.66a.996.996 0 000 1.41l4.95 4.95c.39.39 1.02.39 1.41 0l6.36-6.36a.996.996 0 000-1.41L14.16 2.3a.975.975 0 00-1.4-.01z"
        fill="currentColor"
      />
    </svg>
  );
}
