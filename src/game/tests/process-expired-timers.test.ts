import { describe, expect, it } from '@effect/vitest';
import { Effect, Option } from 'effect';
import { PlayerId } from '../player.entity.js';
import { GameBuilder } from './game.builder.js';
import {
  GameDriver,
  makeGameDriverTestLayerWithTestClock,
  TestClockController,
} from './game.driver.js';

describe('ProcessExpiredTimersUseCase', () => {
  describe('Storytelling phase auto-play', () => {
    it.effect(
      'should auto-submit clue when storyteller deadline expires',
      () => {
        return Effect.gen(function* () {
          const gameDriver = (yield* GameDriver).withFailFastMode();
          const testClock = yield* TestClockController;

          // Create and start a game
          const gameBuilder = new GameBuilder('game-1')
            .hostedBy('alice')
            .withDeck('deck-1')
            .withPlayers('alice', 'bob', 'charlie')
            .withEndCondition({
              type: 'NumberOfTimesBeingStoryteller',
              numberOfTimes: 1,
            })
            .started();

          yield* gameBuilder.build(gameDriver);

          // Verify game is in storytelling phase with deadline set
          let game = yield* gameDriver.getStartedGameSnapshot('game-1');
          expect(game.currentTurn.phase).toBe('storytelling');
          expect(
            game.currentTurn.playerDeadlines.get(
              PlayerId(game.currentTurn.currentStorytellerId),
            ),
          ).toBeDefined();

          // Advance time past the deadline (30 seconds)
          testClock.tick(30_000);

          // Process expired timers
          yield* gameDriver.when.processingExpiredTimers({
            gameId: 'game-1',
          });

          // Verify auto-play: clue submitted with "..." and random card
          game = yield* gameDriver.getStartedGameSnapshot('game-1');
          expect(game.currentTurn.phase).toBe('selecting-cards');
          const turnClue = Option.getOrThrowWith(
            game.currentTurn.turnClue,
            () => new Error('Expected clue to be set after auto-play'),
          );
          expect(turnClue.clue).toBe('...');
        }).pipe(Effect.provide(makeGameDriverTestLayerWithTestClock()));
      },
    );

    it.effect('should not auto-play when deadline has not expired', () => {
      return Effect.gen(function* () {
        const gameDriver = (yield* GameDriver).withFailFastMode();
        const testClock = yield* TestClockController;

        const gameBuilder = new GameBuilder('game-1')
          .hostedBy('alice')
          .withDeck('deck-1')
          .withPlayers('alice', 'bob', 'charlie')
          .started();

        yield* gameBuilder.build(gameDriver);

        // Advance time but NOT past the deadline (only 20 seconds)
        testClock.tick(20_000);

        // Process expired timers
        yield* gameDriver.when.processingExpiredTimers({
          gameId: 'game-1',
        });

        // Verify no auto-play occurred - still in storytelling
        const game = yield* gameDriver.getStartedGameSnapshot('game-1');
        expect(game.currentTurn.phase).toBe('storytelling');
        expect(game.currentTurn.turnClue).toEqual(Option.none());
      }).pipe(Effect.provide(makeGameDriverTestLayerWithTestClock()));
    });
  });
});
