import { Data } from 'effect';
import type { GameId } from './game.entity.js';
import type { PlayerId } from './player.entity.js';

/**
 * Domain events for game state changes.
 * Events describe what happened (past tense), not what to do.
 */
export type GameEvent = Data.TaggedEnum<{
  PlayerJoined: { readonly gameId: GameId; readonly playerId: PlayerId };
  PlayerLeft: { readonly gameId: GameId; readonly playerId: PlayerId };
  GameStarted: { readonly gameId: GameId };
  ClueSubmitted: {
    readonly gameId: GameId;
    readonly wasAutoPlayed: boolean;
  };
  CardSelected: {
    readonly gameId: GameId;
    readonly playerId: PlayerId;
    readonly wasAutoPlayed: boolean;
  };
  VoteSubmitted: {
    readonly gameId: GameId;
    readonly playerId: PlayerId;
    readonly wasAutoPlayed: boolean;
  };
  TurnScored: { readonly gameId: GameId };
  GameEnded: { readonly gameId: GameId };
}>;

const {
  $match: matchGameEvent,
  PlayerJoined,
  PlayerLeft,
  GameStarted,
  ClueSubmitted,
  CardSelected,
  VoteSubmitted,
  TurnScored,
  GameEnded,
} = Data.taggedEnum<GameEvent>();

export {
  CardSelected,
  ClueSubmitted,
  GameEnded,
  GameStarted,
  matchGameEvent,
  PlayerJoined,
  PlayerLeft,
  TurnScored,
  VoteSubmitted,
};

/**
 * Extract specific event types for function signatures.
 */
export type PlayerJoinedEvent = Extract<
  GameEvent,
  { readonly _tag: 'PlayerJoined' }
>;
export type PlayerLeftEvent = Extract<
  GameEvent,
  { readonly _tag: 'PlayerLeft' }
>;
export type GameStartedEvent = Extract<
  GameEvent,
  { readonly _tag: 'GameStarted' }
>;
export type ClueSubmittedEvent = Extract<
  GameEvent,
  { readonly _tag: 'ClueSubmitted' }
>;
export type CardSelectedEvent = Extract<
  GameEvent,
  { readonly _tag: 'CardSelected' }
>;
export type VoteSubmittedEvent = Extract<
  GameEvent,
  { readonly _tag: 'VoteSubmitted' }
>;
export type TurnScoredEvent = Extract<
  GameEvent,
  { readonly _tag: 'TurnScored' }
>;
export type GameEndedEvent = Extract<GameEvent, { readonly _tag: 'GameEnded' }>;
