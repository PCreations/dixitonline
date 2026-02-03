import { Context, Effect, Layer } from 'effect';

/**
 * Clock service for time abstraction.
 * Allows production code to use real time while tests can control time manually.
 */
export class Clock extends Context.Tag('Clock')<
  Clock,
  {
    readonly now: () => Effect.Effect<Date>;
  }
>() {}

/**
 * Production implementation using system time.
 */
export const ClockLive = Layer.succeed(Clock, {
  now: () => Effect.sync(() => new Date()),
});

/**
 * Controller interface for test clock operations.
 * Provides methods to manipulate time in tests.
 */
export type TestClockControllerService = {
  readonly tick: (ms: number) => void;
  readonly setTime: (date: Date) => void;
};

/**
 * Context tag for accessing the test clock controller in tests.
 * Allows tests to advance time or set it to specific values.
 */
export class TestClockController extends Context.Tag('TestClockController')<
  TestClockController,
  TestClockControllerService
>() {}

/**
 * Creates a controllable test clock.
 * Time can be advanced using tick() or set absolutely using setTime().
 */
export const makeTestClock = (initialTime: Date = new Date()) => {
  let currentTime = initialTime;

  const controller: TestClockControllerService = {
    tick: (ms: number) => {
      currentTime = new Date(currentTime.getTime() + ms);
    },
    setTime: (date: Date) => {
      currentTime = date;
    },
  };

  return {
    layer: Layer.succeed(Clock, {
      now: () => Effect.succeed(currentTime),
    }),
    controllerLayer: Layer.succeed(TestClockController, controller),
    tick: controller.tick,
    setTime: controller.setTime,
  };
};
