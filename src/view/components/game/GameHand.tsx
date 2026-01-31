/** @jsx h */
import { h } from 'preact';
import { Card } from '../Card.js';

interface CardInfo {
  readonly id: string;
  readonly url: string;
}

interface PlayerHandProps {
  readonly hand: ReadonlyArray<CardInfo>;
  readonly renderModalContent: (cardId: string) => h.JSX.Element;
}

export function PlayerHand({ hand, renderModalContent }: PlayerHandProps) {
  return (
    <div className="game-cards">
      {hand.map((card, index) => (
        <Card
          key={card.id}
          id={card.id}
          url={card.url}
          index={index}
          total={hand.length}
          modalContent={renderModalContent(card.id)}
        />
      ))}
    </div>
  );
}
