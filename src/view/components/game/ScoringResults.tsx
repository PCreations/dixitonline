/** @jsx h */
import { h } from 'preact';
import type { ScoringView } from '../../view-models/game.view-model.js';
import { Card } from '../Card.js';
import { ClueDisplay } from './ClueDisplay.js';
import { PlayerStatusList } from './PlayerStatusList.js';

interface ScoringResultsProps {
  readonly view: ScoringView;
}

export function ScoringResults({ view }: ScoringResultsProps) {
  const isReady =
    view.playersStatus.find((ps) => ps.player.isCurrentPlayer)?.status ===
    'ready';

  return (
    <div className="scoring-results">
      <div className="phase-instructions">
        <h2 className="phase-title">Résultats du tour</h2>
        <p className="phase-description">
          Découvre qui a trouvé la bonne carte et les points gagnés !
        </p>
      </div>

      <ClueDisplay clue={view.clue} storytellerName={view.storyteller.name} />

      <div className="board-section">
        <p className="board-label">Votes révélés :</p>
        <div className="cards-grid board-cards scoring-cards">
          {view.boardCards.map((card) => {
            const isStorytellerCard = card.id === view.storytellerCardId;
            const voters = view.votes[card.id] ?? [];

            return (
              <div
                key={card.id}
                className={`card-scoring ${isStorytellerCard ? 'card-storyteller' : ''}`}
              >
                <Card id={card.id} url={card.url} />
                {isStorytellerCard && (
                  <div className="card-storyteller-badge">
                    <StarIcon />
                    Carte du conteur
                  </div>
                )}
                {voters.length > 0 && (
                  <div className="card-voters">
                    {voters.map((voter) => (
                      <span key={voter.id} className="voter-name">
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

      <div className="points-section">
        <h3 className="points-title">Tes points ce tour :</h3>
        {view.pointsEarned.length > 0 ? (
          <div className="points-list">
            {view.pointsEarned.map((p, i) => (
              <div key={i} className="point-item">
                <span className="point-value">+{p.points}</span>
                <span className="point-reason">{getReasonLabel(p.reason)}</span>
              </div>
            ))}
            <div className="points-total">
              Total : +{view.pointsEarned.reduce((sum, p) => sum + p.points, 0)}{' '}
              points
            </div>
          </div>
        ) : (
          <p className="no-points">Aucun point ce tour</p>
        )}
      </div>

      {!isReady ? (
        <form
          hx-post={view.action.url}
          hx-target="#game-content"
          hx-swap="innerHTML"
          className="continue-form"
        >
          <button type="submit" className="btn btn-primary">
            <ContinueIcon />
            {view.action.label}
          </button>
        </form>
      ) : (
        <div className="waiting-message">
          <p>En attente des autres joueurs...</p>
        </div>
      )}

      <PlayerStatusList players={view.playersStatus} />
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
