import { describe, expect, it } from '@effect/vitest';
import { Effect, Schema } from 'effect';
import { GameBuilder } from '../../tests/game.builder.js';
import {
  GameDriver,
  makeGameDriverUnitTestLayer,
} from '../../tests/game.driver.js';
import { NotStartedGameSnapshotSchema } from './drizzle-game.repository.js';

describe('GameSchema decoding from drizzle to game snapshot, and encoding from game snapshot to drizzle', () => {
  it.effect('should be able to encode from a not started game snapshot to a drizzle game', () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;
      const gameBuilder = new GameBuilder('id-game-id')
        .hostedBy('id-player-1')
        .withDeck('game-deck-id')
        .withPlayers('id-player-1', 'id-player-2', 'id-player-3', 'id-player-4')
        .withEndCondition({
          type: 'NumberOfTimesBeingStoryteller',
          numberOfTimes: 1,
        });
      const gameSnapshot = yield* gameBuilder.build(gameDriver);
    

      const encoded = yield* Schema.encodeUnknown(NotStartedGameSnapshotSchema)(gameSnapshot);

      expect(encoded).toEqual({
        id: 'id-game-id',
        status: {
          _tag: 'NotStartedGame',
        },
        createdBy: 'id-player-1',
        deckId: 'game-deck-id',
        endCondition: {
          type: 'NumberOfTimesBeingStoryteller',
          numberOfTimes: 1,
        },
        players: ['id-player-1', 'id-player-2', 'id-player-3', 'id-player-4'],
        version: expect.any(Number),
      });
    }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
  });

  it.effect('should be able to decode a not started game snapshot', () => {
    return Effect.gen(function* () {
      const encodedGameSnapshot = {
        id: 'id-game-1',
        status: {
          _tag: 'NotStartedGame',
        },
        createdBy: 'id-player-1',
        deckId: 'id-deck-1',
        endCondition: {
          type: 'NumberOfTimesBeingStoryteller',
          numberOfTimes: 1,
        },
        players: ['id-player-1', 'id-player-2', 'id-player-3', 'id-player-4'],
        version: 1,
      };

      const decoded =
        yield* Schema.decodeUnknown(NotStartedGameSnapshotSchema)(encodedGameSnapshot);

      expect(decoded).toEqual({
        id: 'id-game-1',
        status: {
          _tag: 'NotStartedGame',
        },
        createdBy: 'id-player-1',
        deckId: 'id-deck-1',
        endCondition: {
          type: 'NumberOfTimesBeingStoryteller',
          numberOfTimes: 1,
        },
        players: ['id-player-1', 'id-player-2', 'id-player-3', 'id-player-4'],
        version: 1,
      });
    });
  });

  it.effect('should be able to encode a started game snapshot', () => {
    return Effect.gen(function* () {
       const gameDriver = yield* GameDriver;
      const gameBuilder = new GameBuilder('id-game-id')
        .hostedBy('id-player-1')
        .withDeck('game-deck-id')
        .withPlayers('id-player-1', 'id-player-2', 'id-player-3', 'id-player-4')
        .withEndCondition({
          type: 'NumberOfTimesBeingStoryteller',
          numberOfTimes: 1,
        })
        .started()
        .withSubmittedClueOnCardIndex('A card', 0)
        .withSelectedCard({ playerId: 'id-player-1', cardIndex: 0 })
        .withSelectedCard({ playerId: 'id-player-2', cardIndex: 1 })
        .withSelectedCard({ playerId: 'id-player-3', cardIndex: 2 })
        .withSelectedCard({ playerId: 'id-player-4', cardIndex: 3 })
        .withVotedCards([{ playerId: 'id-player-1', cardSelectedByPlayer: 'id-player-2' }, { playerId: 'id-player-2', cardSelectedByPlayer: 'id-player-3' }, { playerId: 'id-player-3', cardSelectedByPlayer: 'id-player-4' }])
        .withScores([{ playerId: 'id-player-1', score: 5 }, { playerId: 'id-player-2', score: 5 }, { playerId: 'id-player-3', score: 5 }, { playerId: 'id-player-4', score: 5 }]) 
        .withPlayersReadyForNextTurn(['id-player-1', 'id-player-2', 'id-player-3'])
        .withPlayersHavingBeenStorytellerXNumberOfTimes(new Map([['id-player-1', 1], ['id-player-2', 0], ['id-player-3', 0], ['id-player-4', 0]]))
        .inScoringPhaseSince(new Date('2025-01-01T00:00:00.000Z'))

      const gameSnapshot = yield* gameBuilder.build(gameDriver);

      const encoded = yield* Schema.encode(StartedGameSnapshotSchema)(gameSnapshot);

      expect(encoded).toEqual({
        id: 'id-game-id',
        status: {
          _tag: 'StartedGame',
        },
      });
    }).pipe(Effect.provide(makeGameDriverUnitTestLayer()))
  })
});
