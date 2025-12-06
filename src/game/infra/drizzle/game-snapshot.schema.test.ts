import { describe, expect, it } from '@effect/vitest';
import { Effect, Schema } from 'effect';
import { NotStartedGameSnapshotSchema, StartedGameSnapshotSchema } from '../../game-snapshot.schema.js';
import { GameBuilder } from '../../tests/game.builder.js';
import {
  GameDriver,
  makeGameDriverTestLayer,
} from '../../tests/game.driver.js';

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
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
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
        .withSubmittedClueOnCardIndex('some clue', 0)
        .withSelectedCard({ playerId: 'id-player-2', cardIndex: 0 })
        .withSelectedCard({ playerId: 'id-player-3', cardIndex: 0 })
        .withSelectedCard({ playerId: 'id-player-4', cardIndex: 0 })
        .withVotedCards([
          { playerId: 'id-player-2', cardSelectedByPlayer: 'id-player-1' },
          { playerId: 'id-player-3', cardSelectedByPlayer: 'id-player-1' },
          { playerId: 'id-player-4', cardSelectedByPlayer: 'id-player-1' },
        ])
        .withScores([
          { playerId: 'id-player-1', score: 5 },
          { playerId: 'id-player-2', score: 5 },
          { playerId: 'id-player-3', score: 5 },
          { playerId: 'id-player-4', score: 5 },
        ])
        .withPlayersReadyForNextTurn(['id-player-1', 'id-player-2', 'id-player-3'])
        .withPlayersHavingBeenStorytellerXNumberOfTimes(
          new Map([
            ['id-player-1', 1],
            ['id-player-2', 0],
            ['id-player-3', 0],
            ['id-player-4', 0],
          ]),
        );

      const gameSnapshot = yield* gameBuilder.build(gameDriver);

      const encoded = yield* Schema.encodeUnknown(StartedGameSnapshotSchema)(gameSnapshot);

      console.log(encoded);

      // Verify the schema correctly encodes the snapshot to JSONB format
      expect(encoded).toEqual({
        id: 'id-game-id',
        status: {
          _tag: 'StartedGame',
        },
        createdBy: 'id-player-1',
        deckId: 'game-deck-id',
        endCondition: {
          type: 'NumberOfTimesBeingStoryteller',
          numberOfTimes: 1,
        },
        players: ['id-player-1', 'id-player-2', 'id-player-3', 'id-player-4'],
        version: expect.any(Number),
        scores: [
          { playerId: 'id-player-1', score: 5 },
          { playerId: 'id-player-2', score: 7 },
          { playerId: 'id-player-3', score: 7 },
          { playerId: 'id-player-4', score: 7 },
        ],
        playersReadyForNextTurn: ['id-player-1', 'id-player-2', 'id-player-3'],
        playersHavingBeenStoryteller: {
          'id-player-1': 1,
          'id-player-2': 0,
          'id-player-3': 0,
          'id-player-4': 0,
        },
        randomizeStrategy: 'noop',
        currentTurn: {
          id: 'id-game-id-turn-1',
          gameId: 'id-game-id',
          currentStorytellerId: 'id-player-1',
          playerHands: expect.any(Array),
          cardsInDrawPile: expect.any(Array),
          phase: 'scoring',
          turnNumber: 1,
          turnClue: {
            _tag: 'Some',
            value: {
              clue: 'some clue',
              cardId: 'card-1',
            },
          },
          startedAt: expect.any(String), // Date is created dynamically when turn starts
          selectedCards: expect.arrayContaining([
            { cardId: 'card-7', playerId: 'id-player-2' },
            { cardId: 'card-13', playerId: 'id-player-3' },
            { cardId: 'card-19', playerId: 'id-player-4' },
          ]),
          votedCards: expect.arrayContaining([
            { cardId: 'card-1', ownedBy: 'id-player-1', votedBy: 'id-player-2' },
            { cardId: 'card-1', ownedBy: 'id-player-1', votedBy: 'id-player-3' },
            { cardId: 'card-1', ownedBy: 'id-player-1', votedBy: 'id-player-4' },
          ]),
          pointsByPlayer: [
            [
              'id-player-1',
              [
                {
                  points: 0,
                  reason: { _tag: 'EveryoneFoundTheStorytellerCard' }
                }
              ]
            ],
            [
              'id-player-2',
              [
                {
                  points: 2,
                  reason: { _tag: 'EveryoneFoundTheStorytellerCard' }
                }
              ]
            ],
            [
              'id-player-3',
              [
                {
                  points: 2,
                  reason: { _tag: 'EveryoneFoundTheStorytellerCard' }
                }
              ]
            ],
            [
              'id-player-4',
              [
                {
                  points: 2,
                  reason: { _tag: 'EveryoneFoundTheStorytellerCard' }
                }
              ]
            ]
          ],
        },
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });
});
