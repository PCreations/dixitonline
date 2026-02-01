/** @jsx h */
import { h } from 'preact';
import type { GamePlayerView } from '../view-models/game.view-model.js';
import { Game } from './Game.js';
import { Menu } from './Menu.js';
import { Stars } from './Stars.js';

interface GamePageProps {
  readonly view: GamePlayerView;
  readonly gameId: string;
}

/**
 * GamePage component with SSE support for real-time updates.
 * Wraps the Game component with SSE connection for automatic UI updates
 * when other players take actions.
 */
export function GamePage({ view, gameId }: GamePageProps) {
  return (
    <div className="game-page">
      <Menu />
      <Stars />

      {/* SSE container for real-time updates with Alpine.js morph for state preservation */}
      <div hx-ext="sse,alpine-morph" sse-connect={`/game/${gameId}/events`}>
        <Game view={view} />
      </div>
    </div>
  );
}
