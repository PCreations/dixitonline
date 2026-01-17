/** @jsx h */
import { h } from 'preact';
import type { VotingAsGuesserView } from '../../view-models/game.view-model.js';
import { Card } from '../Card.js';
import { ClueDisplay } from './ClueDisplay.js';
import { PlayerStatusList } from './PlayerStatusList.js';

interface VotingBoardProps {
  readonly view: VotingAsGuesserView;
}

export function VotingBoard({ view }: VotingBoardProps) {
  if (view.hasVoted) {
    return (
      <div className="voting-board voting-done">
        <div className="phase-instructions">
          <h2 className="phase-title">Vote enregistré !</h2>
          <p className="phase-description">En attente des autres joueurs...</p>
        </div>

        <ClueDisplay clue={view.clue} storytellerName={view.storyteller.name} />

        <div className="board-section">
          <p className="board-label">Cartes sur le plateau :</p>
          <div className="cards-grid board-cards">
            {view.boardCards.map((card) => (
              <Card key={card.id} id={card.id} url={card.url} />
            ))}
          </div>
        </div>

        <PlayerStatusList players={view.playersStatus} />
      </div>
    );
  }

  return (
    <div className="voting-board">
      <div className="phase-instructions">
        <h2 className="phase-title">Vote !</h2>
        <p className="phase-description">
          Trouve la carte du conteur parmi toutes les cartes. Tu ne peux pas
          voter pour ta propre carte.
        </p>
      </div>

      <ClueDisplay clue={view.clue} storytellerName={view.storyteller.name} />

      <form
        hx-post={view.action.url}
        hx-target="#game-content"
        hx-swap="innerHTML"
        x-data="{ selectedCard: null }"
        className="voting-form"
      >
        <input type="hidden" name="cardId" x-bind:value="selectedCard" />

        <div className="board-section">
          <p className="board-label">Clique sur la carte du conteur :</p>
          <div className="cards-grid board-cards">
            {view.boardCards.map((card) => {
              const isOwnCard = card.id === view.ownCardId;
              return (
                <div
                  key={card.id}
                  className={`card-votable ${isOwnCard ? 'card-own' : ''}`}
                  x-on:click={isOwnCard ? '' : `selectedCard = '${card.id}'`}
                  x-bind:class={`selectedCard === '${card.id}' ? 'card-selected' : ''`}
                  title={
                    isOwnCard ? 'Ta carte - tu ne peux pas voter pour elle' : ''
                  }
                >
                  <Card id={card.id} url={card.url} />
                  {isOwnCard && <div className="card-own-badge">Ta carte</div>}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          x-bind:disabled="!selectedCard"
        >
          <VoteIcon />
          {view.action.label}
        </button>
      </form>

      <PlayerStatusList players={view.playersStatus} />
    </div>
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
