/** @jsx h */
import { h } from 'preact';
import type {
  SelectingCardsAsStorytellerView,
  VotingAsStorytellerView,
} from '../../view-models/game.view-model.js';
import { Card } from '../Card.js';
import { ClueDisplay } from './ClueDisplay.js';
import { PlayerStatusList } from './PlayerStatusList.js';

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
    <div className="waiting-for-players">
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

      <PlayerStatusList players={view.playersStatus} />

      <div className="hand-section">
        <p className="hand-label">Tes cartes restantes :</p>
        <div className="cards-grid cards-preview">
          {view.hand.map((card) => (
            <Card key={card.id} id={card.id} url={card.url} />
          ))}
        </div>
      </div>
    </div>
  );
}
