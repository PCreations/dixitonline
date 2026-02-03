import { describe, expect, it } from '@effect/vitest';
import { Effect, Option, Schema } from 'effect';
import {
  NotStartedGameSnapshotSchema,
  StartedGameSnapshotSchema,
} from '../../game-snapshot.schema.js';
import { PlayerId } from '../../player.entity.js';
import { GameBuilder } from '../../tests/game.builder.js';
import {
  GameDriver,
  makeGameDriverTestLayer,
  makeGameDriverTestLayerWithTestClock,
} from '../../tests/game.driver.js';

describe('GameSchema decoding from drizzle to game snapshot, and encoding from game snapshot to drizzle', () => {
  it.effect(
    'should be able to encode from a not started game snapshot to a drizzle game',
    () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        const gameBuilder = new GameBuilder('id-game-id')
          .hostedBy('id-player-1')
          .withDeck('game-deck-id')
          .withPlayers(
            'id-player-1',
            'id-player-2',
            'id-player-3',
            'id-player-4',
          )
          .withEndCondition({
            type: 'NumberOfTimesBeingStoryteller',
            numberOfTimes: 1,
          });
        const gameSnapshot = yield* gameBuilder.build(gameDriver);

        const encoded = yield* Schema.encodeUnknown(
          NotStartedGameSnapshotSchema,
        )(gameSnapshot);

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
    },
  );

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

      const decoded = yield* Schema.decodeUnknown(NotStartedGameSnapshotSchema)(
        encodedGameSnapshot,
      );

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
    // Using test clock starting at 2024-01-01T12:00:00Z
    // Storyteller deadline is set at game start: now + 30000ms = 2024-01-01T12:00:30Z
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
        .withPlayersReadyForNextTurn([
          'id-player-1',
          'id-player-2',
          'id-player-3',
        ])
        .withPlayersHavingBeenStorytellerXNumberOfTimes(
          new Map([
            ['id-player-1', 1],
            ['id-player-2', 0],
            ['id-player-3', 0],
            ['id-player-4', 0],
          ]),
        );

      const gameSnapshot = yield* gameBuilder.build(gameDriver);

      const encoded = yield* Schema.encodeUnknown(StartedGameSnapshotSchema)(
        gameSnapshot,
      );

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
          startedAt: '2024-01-01T12:00:00.000Z',
          selectedCards: expect.arrayContaining([
            { cardId: 'card-7', playerId: 'id-player-2' },
            { cardId: 'card-13', playerId: 'id-player-3' },
            { cardId: 'card-19', playerId: 'id-player-4' },
          ]),
          votedCards: expect.arrayContaining([
            {
              cardId: 'card-1',
              ownedBy: 'id-player-1',
              votedBy: 'id-player-2',
            },
            {
              cardId: 'card-1',
              ownedBy: 'id-player-1',
              votedBy: 'id-player-3',
            },
            {
              cardId: 'card-1',
              ownedBy: 'id-player-1',
              votedBy: 'id-player-4',
            },
          ]),
          pointsByPlayer: [
            [
              'id-player-1',
              [
                {
                  points: 0,
                  reason: { _tag: 'EveryoneFoundTheStorytellerCard' },
                },
              ],
            ],
            [
              'id-player-2',
              [
                {
                  points: 2,
                  reason: { _tag: 'EveryoneFoundTheStorytellerCard' },
                },
              ],
            ],
            [
              'id-player-3',
              [
                {
                  points: 2,
                  reason: { _tag: 'EveryoneFoundTheStorytellerCard' },
                },
              ],
            ],
            [
              'id-player-4',
              [
                {
                  points: 2,
                  reason: { _tag: 'EveryoneFoundTheStorytellerCard' },
                },
              ],
            ],
          ],
          // Player 4 hasn't notified ready yet, so still has deadline from scoring phase
          playerDeadlines: [['id-player-4', '2024-01-01T12:00:30.000Z']],
        },
      });
    }).pipe(Effect.provide(makeGameDriverTestLayerWithTestClock()));
  });

  it.effect(
    'should correctly encode and decode playerDeadlines with non-empty Map',
    () => {
      return Effect.gen(function* () {
        const deadline1 = new Date('2024-01-01T12:00:30.000Z');
        const deadline2 = new Date('2024-01-01T12:01:00.000Z');

        // Manually build a minimal started game snapshot with playerDeadlines
        const gameSnapshot = {
          id: 'id-game-deadlines',
          status: { _tag: 'StartedGame' as const },
          createdBy: 'id-player-1',
          deckId: 'game-deck-id',
          endCondition: {
            type: 'NumberOfTimesBeingStoryteller' as const,
            numberOfTimes: 1,
          },
          players: ['id-player-1', 'id-player-2', 'id-player-3'],
          version: 1,
          scores: [
            { playerId: 'id-player-1' as const, score: 0 },
            { playerId: 'id-player-2' as const, score: 0 },
            { playerId: 'id-player-3' as const, score: 0 },
          ],
          playersReadyForNextTurn: [],
          playersHavingBeenStoryteller: {
            'id-player-1': 0,
            'id-player-2': 0,
            'id-player-3': 0,
          },
          randomizeStrategy: 'noop',
          currentTurn: {
            id: 'id-game-deadlines-turn-1',
            gameId: 'id-game-deadlines',
            currentStorytellerId: 'id-player-1',
            playerHands: [
              {
                playerId: 'id-player-1',
                cards: [{ id: 'card-1', url: 'https://example.com/card-1' }],
              },
            ],
            cardsInDrawPile: [],
            phase: 'storytelling' as const,
            turnNumber: 1,
            turnClue: Option.none(),
            startedAt: new Date('2024-01-01T12:00:00.000Z'),
            selectedCards: [],
            votedCards: [],
            pointsByPlayer: new Map(),
            // This is the key test: non-empty playerDeadlines
            playerDeadlines: new Map([
              ['id-player-1', deadline1],
              ['id-player-2', deadline2],
            ]),
          },
        };

        // Encode to JSONB format
        const encoded = yield* Schema.encodeUnknown(StartedGameSnapshotSchema)(
          gameSnapshot,
        );

        // Verify encoding: Maps become arrays of key-value pairs
        expect(encoded.currentTurn.playerDeadlines).toEqual([
          ['id-player-1', '2024-01-01T12:00:30.000Z'],
          ['id-player-2', '2024-01-01T12:01:00.000Z'],
        ]);

        // Decode back from JSONB format
        const decoded = yield* Schema.decodeUnknown(StartedGameSnapshotSchema)(
          encoded,
        );

        // Verify decoding: arrays become Maps again
        expect(decoded.currentTurn.playerDeadlines).toBeInstanceOf(Map);
        expect(decoded.currentTurn.playerDeadlines.size).toBe(2);
        expect(
          decoded.currentTurn.playerDeadlines.get(PlayerId('id-player-1')),
        ).toEqual(deadline1);
        expect(
          decoded.currentTurn.playerDeadlines.get(PlayerId('id-player-2')),
        ).toEqual(deadline2);
      });
    },
  );
});
