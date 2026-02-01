/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from 'preact';
import type {
  SelectingCardsAsStorytellerView,
  VotingAsStorytellerView,
} from '../../view-models/game.view-model.js';
import { Card } from '../Card.js';
import { ClueDisplay } from './ClueDisplay.js';
import { PlayerHand } from './GameHand.js';

type WaitingForPlayersProps =
  | {
      readonly view: SelectingCardsAsStorytellerView;
      readonly phase: 'selecting';
    }
  | { readonly view: VotingAsStorytellerView; readonly phase: 'voting' };

export function WaitingForPlayers(props: WaitingForPlayersProps) {
  const { view, phase } = props;

  const phaseMessage =
    phase === 'selecting'
      ? 'Les joueurs choisissent leurs cartes...'
      : 'Les joueurs votent...';

  return (
    <>
      <div className="phase-description-container">
        <div className="phase-instructions">
          <h2 className="phase-title">En attente</h2>
          <p className="phase-description">{phaseMessage}</p>
        </div>

        <ClueDisplay clue={view.clue} storytellerName="toi" />

        {phase === 'voting' && 'boardCards' in view && (
          <div className="board-section">
            <p className="board-label">Cartes sur le plateau :</p>
            <div className="cards-grid board-cards">
              {view.boardCards.map((card) => (
                <Card key={card.id} id={card.id} url={card.url} />
              ))}
            </div>
          </div>
        )}
      </div>

      <PlayerHand hand={view.hand} renderModalContent={() => <></>} />
    </>
  );
}
