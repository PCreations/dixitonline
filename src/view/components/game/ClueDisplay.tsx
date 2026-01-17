/** @jsx h */
import { h } from 'preact';

interface ClueDisplayProps {
  readonly clue: string;
  readonly storytellerName: string;
}

export function ClueDisplay({ clue, storytellerName }: ClueDisplayProps) {
  return (
    <div className="clue-display">
      <span className="clue-label">Indice de {storytellerName} :</span>
      <span className="clue-text">"{clue}"</span>
    </div>
  );
}
