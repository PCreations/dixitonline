/**
 * GameDriver Interface - Shared between all test channels
 *
 * This file contains only the interface and Context.Tag definition,
 * without any test framework dependencies (vitest, playwright, etc.).
 * This allows different test runners to provide their own implementations.
 */

import { Context, Effect, type ParseResult } from 'effect';

import type { DeckSnapshot } from '../deck.entity.js';
import type {
  EndedGameSnapshot,
  GameEntity,
  GameEntitySnapshot,
  PlayersRandomizeStrategy,
  StartedGameSnapshot,
} from '../game.entity.js';
import type { DatabaseError } from '../game.repository.js';
import type { GameViewValueObject } from '../game-view-projector.js';
import type { GameBuilder } from './game.builder.js';

type EndConditionDto =
  | {
      type: 'NumberOfTimesBeingStoryteller';
      numberOfTimes: number;
    }
  | {
      type: 'LimitOfPoints';
      limit: number;
    };

// Common error type for test driver operations
export type DriverError = ParseResult.ParseError | DatabaseError;

/**
 * GameDriverDSL - The interface that all test drivers must implement
 */
export interface GameDriverDSL {
  readonly getGameSnapshot: (
    gameId: string,
  ) => Effect.Effect<GameEntitySnapshot, DriverError>;
  readonly getStartedGameSnapshot: (
    gameId: string,
  ) => Effect.Effect<StartedGameSnapshot, DriverError>;
  readonly gameEndedGameSnapshot: (
    gameId: string,
  ) => Effect.Effect<EndedGameSnapshot, DriverError>;
  readonly unsafe__saveGameEntity: (game: GameEntity) => Effect.Effect<void>;
  readonly given: {
    readonly defaultDeck: (props: {
      id: string;
      cards?: ReadonlyArray<string>;
      withShuffledCards?: ReadonlyArray<string>;
    }) => Effect.Effect<void>;
    readonly existingDeck: (props: {
      id: string;
      cards?: ReadonlyArray<string>;
      shuffleStrategy?: 'identity' | 'shuffle';
    }) => Effect.Effect<DeckSnapshot>;
    readonly existingNonStartedGame: (props: {
      gameId: string;
      hostId: string;
      deckId?: string;
      players?: ReadonlyArray<string>;
      endCondition?: EndConditionDto;
    }) => Effect.Effect<void>;
    readonly existingFullGame: (props: {
      gameId: string;
    }) => Effect.Effect<void>;
    readonly existingGame: (
      driver: GameDriverDSL,
      builder: GameBuilder,
    ) => Effect.Effect<
      {
        game: GameEntitySnapshot;
        deck: DeckSnapshot;
      },
      DriverError
    >;
  };
  readonly withFailFastMode: () => GameDriverDSL;
  readonly when: {
    readonly creatingGame: (props: {
      gameId: string;
      hostId: string;
      deckId?: string;
      endCondition?: EndConditionDto;
    }) => Effect.Effect<void>;
    readonly joiningGame: (props: {
      gameId: string;
      playerId: string;
    }) => Effect.Effect<void>;
    readonly joiningGameWhileAnotherPlayerJustJoinedInBetween: (props: {
      gameId: string;
      playerId: string;
      playerThatHasJustJoinedInBetween: string;
    }) => Effect.Effect<void, DriverError>;
    readonly leavingGame: (props: {
      gameId: string;
      playerId: string;
    }) => Effect.Effect<void>;
    readonly startingGame: (props: {
      gameId: string;
      playerId: string;
      randomizeStrategy?: PlayersRandomizeStrategy;
    }) => Effect.Effect<void>;
    readonly startingGameWhileAnotherPlayerLeftInBetween: (props: {
      gameId: string;
      playerId: string;
      playerThatHasLeftInBetween: string;
    }) => Effect.Effect<void, DriverError>;
    readonly submittingClue: (props: {
      gameId: string;
      playerId: string;
      cardId: string;
      clue: string;
    }) => Effect.Effect<void>;
    readonly selectingCard: (props: {
      gameId: string;
      playerId: string;
      cardId: string;
    }) => Effect.Effect<void>;
    readonly votingOnCard: (props: {
      gameId: string;
      playerId: string;
      cardId: string;
    }) => Effect.Effect<void>;
    readonly notifyingToBeReadyForNextTurn: (props: {
      gameId: string;
      playerId: string;
    }) => Effect.Effect<void>;
    readonly processingExpiredTimers: (props: {
      gameId: string;
    }) => Effect.Effect<void>;
  };
  readonly assert: {
    readonly createdGameToEqual: (game: {
      id: string;
      createdBy: string;
      deckId: string;
      endCondition?: EndConditionDto;
      players: ReadonlyArray<string>;
    }) => Effect.Effect<void, DriverError, never>;
    readonly playerToHaveJoinedGame: (props: {
      gameId: string;
      playerId: string;
    }) => Effect.Effect<void, DriverError, never>;
    readonly playerToNotHaveBeenAbleToJoinGame: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly playerToNotHaveBeenAbleToLeaveGame: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly playerToNotHaveBeenAbleToStartGame: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly gameToHavePlayers: (props: {
      gameId: string;
      players: ReadonlyArray<string>;
    }) => Effect.Effect<void, DriverError, never>;
    readonly gameToHaveBeenStarted: (props: {
      gameId: string;
    }) => Effect.Effect<void, DriverError, never>;
    readonly currentTurnToBeStarted: (props: {
      gameId: string;
      storytellerId: string;
    }) => Effect.Effect<void, DriverError, never>;
    readonly newTurnToBeStarted: (props: {
      gameId: string;
      storytellerId: string;
      playerHands: ReadonlyArray<{
        playerId: string;
        cards: ReadonlyArray<string>;
      }>;
      cardsInDrawPile: ReadonlyArray<{
        id: string;
        url: string;
      }>;
      playersHavingBeenStoryteller: {
        [playerId: string]: number;
      };
    }) => Effect.Effect<void, DriverError, never>;
    readonly playerHandsToEqual: (props: {
      gameId: string;
      playerHands: ReadonlyArray<{
        playerId: string;
        cards: ReadonlyArray<string>;
      }>;
    }) => Effect.Effect<void, DriverError, never>;
    readonly turnClueToBeSubmitted: (props: {
      gameId: string;
      storytellerClue: string;
      storytellerCardId: string;
    }) => Effect.Effect<void, DriverError, never>;
    readonly turnToHaveSelectedCards: (props: {
      gameId: string;
      selectedCards: ReadonlyArray<{
        cardId: string;
        playerId: string;
      }>;
    }) => Effect.Effect<void, DriverError, never>;
    readonly turnToBeInVotingPhase: (props: {
      gameId: string;
    }) => Effect.Effect<void, DriverError, never>;
    readonly playerToNotHaveBeenAbleToSubmitClue: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly playerToNotHaveBeenAbleToSelectCard: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly playerToHaveVotedOnCard: (props: {
      gameId: string;
      votedBy: string;
      ownedBy: string;
      cardId: string;
    }) => Effect.Effect<void, DriverError, never>;
    readonly playerToNotHaveBeenAbleToVoteOnCard: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly turnToBeInScoringPhase: (props: {
      gameId: string;
    }) => Effect.Effect<void, DriverError, never>;
    readonly playersToHaveScore: (props: {
      gameId: string;
      scores: ReadonlyArray<{
        playerId: string;
        score: number;
      }>;
    }) => Effect.Effect<void, DriverError, never>;
    readonly playersReadyForNextTurnToEqual: (props: {
      gameId: string;
      playersReadyForNextTurn: ReadonlyArray<string>;
    }) => Effect.Effect<void, DriverError, never>;
    readonly playerToNotHaveBeenAbleToNotifyToBeReadyForNextTurn: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly gameViewToEqual: (props: {
      gameId: string;
      gameView: GameViewValueObject;
    }) => Effect.Effect<void, never, never>;
    readonly gameToBeEnded: (props: {
      gameId: string;
    }) => Effect.Effect<void, DriverError, never>;
  };
}

/**
 * GameDriver Context.Tag
 * Used to inject the driver implementation into tests.
 */
export class GameDriver extends Context.Tag('GameDriver')<
  GameDriver,
  GameDriverDSL
>() {}
