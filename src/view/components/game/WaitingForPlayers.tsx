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
    <div className="game-phase-layout">
      <div className="game-phase-layout__content">
        <div className="phase-instructions">
          <h2 className="phase-title">En attente</h2>
          <p className="phase-description">{phaseMessage}</p>
        </div>

        <ClueDisplay clue={view.clue} storytellerName="toi" />

        {phase === 'voting' && 'boardCards' in view && (
          <div className="board-cards-container">
            {view.boardCards.map((card) => (
              <Card key={card.id} id={card.id} url={card.url} size="small" />
            ))}
          </div>
        )}
      </div>

      <div className="game-phase-layout__hand">
        <PlayerHand hand={view.hand} renderModalContent={() => <></>} />
      </div>
    </div>
  );
}
