import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';
import { Clock, ClockLive, makeTestClock } from '../clock.service.js';

describe('Clock Service', () => {
  describe('ClockLive', () => {
    it.effect('returns current date', () =>
      Effect.gen(function* () {
        const before = new Date();
        const clock = yield* Clock;
        const now = yield* clock.now();
        const after = new Date();

        expect(now.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(now.getTime()).toBeLessThanOrEqual(after.getTime());
      }).pipe(Effect.provide(ClockLive)),
    );
  });

  describe('makeTestClock', () => {
    it('starts at provided initial time', () => {
      const initialTime = new Date('2024-01-01T12:00:00Z');
      const testClock = makeTestClock(initialTime);

      const program = Effect.gen(function* () {
        const clock = yield* Clock;
        const now = yield* clock.now();
        return now;
      });

      const result = Effect.runSync(
        program.pipe(Effect.provide(testClock.layer)),
      );

      expect(result.getTime()).toBe(initialTime.getTime());
    });

    it('tick advances time by specified milliseconds', () => {
      const initialTime = new Date('2024-01-01T12:00:00Z');
      const testClock = makeTestClock(initialTime);

      testClock.tick(30_000);

      const program = Effect.gen(function* () {
        const clock = yield* Clock;
        return yield* clock.now();
      });

      const result = Effect.runSync(
        program.pipe(Effect.provide(testClock.layer)),
      );

      expect(result.getTime()).toBe(initialTime.getTime() + 30_000);
    });

    it('multiple ticks accumulate', () => {
      const initialTime = new Date('2024-01-01T12:00:00Z');
      const testClock = makeTestClock(initialTime);

      testClock.tick(10_000);
      testClock.tick(20_000);

      const program = Effect.gen(function* () {
        const clock = yield* Clock;
        return yield* clock.now();
      });

      const result = Effect.runSync(
        program.pipe(Effect.provide(testClock.layer)),
      );

      expect(result.getTime()).toBe(initialTime.getTime() + 30_000);
    });

    it('setTime sets absolute time', () => {
      const initialTime = new Date('2024-01-01T12:00:00Z');
      const newTime = new Date('2024-06-15T18:30:00Z');
      const testClock = makeTestClock(initialTime);

      testClock.setTime(newTime);

      const program = Effect.gen(function* () {
        const clock = yield* Clock;
        return yield* clock.now();
      });

      const result = Effect.runSync(
        program.pipe(Effect.provide(testClock.layer)),
      );

      expect(result.getTime()).toBe(newTime.getTime());
    });

    it('uses current time when no initial time provided', () => {
      const before = new Date();
      const testClock = makeTestClock();

      const program = Effect.gen(function* () {
        const clock = yield* Clock;
        return yield* clock.now();
      });

      const result = Effect.runSync(
        program.pipe(Effect.provide(testClock.layer)),
      );
      const after = new Date();

      expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
