/** @jsx h */
import { h } from 'preact';
import type { ScoringView } from '../../view-models/game.view-model.js';
import { Card } from '../Card.js';
import { ClueDisplay } from './ClueDisplay.js';

interface ScoringResultsProps {
  readonly view: ScoringView;
}

export function ScoringResults({ view }: ScoringResultsProps) {
  const isReady =
    view.playersStatus.find((ps) => ps.player.isCurrentPlayer)?.status ===
    'ready';

  return (
    <div className="game-phase-layout">
      <div className="game-phase-layout__content">
        <div className="phase-instructions">
          <h2 className="phase-title">Résultats du tour</h2>
          <p className="phase-description">
            Découvre qui a trouvé la bonne carte et les points gagnés !
          </p>
        </div>

        <ClueDisplay clue={view.clue} storytellerName={view.storyteller.name} />

        <div className="scoring-points">
          <h3 className="scoring-points__title">Tes points ce tour :</h3>
          {view.pointsEarned.length > 0 ? (
            <div className="scoring-points__list">
              {view.pointsEarned.map((p, i) => (
                <div key={i} className="scoring-points__item">
                  <span className="scoring-points__value">+{p.points}</span>
                  <span className="scoring-points__reason">
                    {getReasonLabel(p.reason)}
                  </span>
                </div>
              ))}
              <div className="scoring-points__total">
                Total : +
                {view.pointsEarned.reduce((sum, p) => sum + p.points, 0)} points
              </div>
            </div>
          ) : (
            <p className="scoring-points__empty">Aucun point ce tour</p>
          )}
        </div>

        <div className="scoring-board">
          <p className="scoring-board__label">Votes révélés :</p>
          <div className="scoring-board__cards">
            {view.boardCards.map((card) => {
              const isStorytellerCard = card.id === view.storytellerCardId;
              const voters = view.votes[card.id] ?? [];

              return (
                <div
                  key={card.id}
                  className={`scoring-card ${isStorytellerCard ? 'scoring-card--storyteller' : ''}`}
                >
                  <Card id={card.id} url={card.url} size="small" disableModal />
                  {isStorytellerCard && (
                    <div className="scoring-card__badge">
                      <StarIcon />
                      Carte du conteur
                    </div>
                  )}
                  {voters.length > 0 && (
                    <div className="scoring-card__voters">
                      {voters.map((voter) => (
                        <span key={voter.id} className="scoring-card__voter">
                          <VoteIcon />
                          {voter.name}
                          {voter.isCurrentPlayer && ' (toi)'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!isReady ? (
          <form
            hx-post={view.action.url}
            hx-target="#game-container"
            hx-swap="outerHTML"
            className="scoring-action"
          >
            <button type="submit" className="btn btn-primary">
              <ContinueIcon />
              {view.action.label}
            </button>
          </form>
        ) : (
          <div className="waiting-animation">
            <p>En attente des autres joueurs...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getReasonLabel(reason: { _tag: string }): string {
  switch (reason._tag) {
    case 'AtLeastOnePlayerFoundTheStorytellerCard':
      return 'Au moins un joueur a trouvé ta carte';
    case 'EveryoneFoundTheStorytellerCard':
      return 'Tout le monde a trouvé ta carte';
    case 'NoOneFoundTheStorytellerCard':
      return "Personne n'a trouvé la carte du conteur";
    case 'YouFoundTheStorytellerCard':
      return 'Tu as trouvé la carte du conteur !';
    case 'APlayerVotedOnYourCard':
      return 'Un joueur a voté pour ta carte';
    default:
      return 'Points bonus';
  }
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );
}

function ContinueIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"
        fill="currentColor"
      />
    </svg>
  );
}

function VoteIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="scoring-card__vote-icon"
    >
      <path d="M18 13h-.68l-2 2h1.91L19 17H5l1.78-2h2.05l-2-2H6l-3 3v4c0 1.1.89 2 1.99 2H19a2 2 0 002-2v-4l-3-3zm-1-5.05l-4.95 4.95-3.54-3.54 4.95-4.95L17 7.95zm-4.24-5.66L6.39 8.66a.996.996 0 000 1.41l4.95 4.95c.39.39 1.02.39 1.41 0l6.36-6.36a.996.996 0 000-1.41L14.16 2.3a.975.975 0 00-1.4-.01z" />
    </svg>
  );
}
