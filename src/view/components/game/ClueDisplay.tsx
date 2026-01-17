/** @jsx h */
import { h } from 'preact';

interface ClueDisplayProps {
  readonly clue: string;
  readonly storytellerName: string;
}

export function ClueDisplay({ clue, storytellerName }: ClueDisplayProps) {
  return (
    <div className="clue-display">
      <div className="clue-icon">💭</div>
      <div className="clue-content">
        <span className="clue-label">Indice de {storytellerName}</span>
        <blockquote className="clue-text">« {clue} »</blockquote>
      </div>
    </div>
  );
}
