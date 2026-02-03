import { Context, Duration, Effect, Layer, Scope } from 'effect';
import { GameRepository } from './game.repository.js';
import { ProcessExpiredTimersUseCase } from './process-expired-timers.usecase.js';

/**
 * TimerPollingDaemon periodically checks for games with expired player deadlines
 * and triggers automatic actions (auto-play) for AFK players.
 *
 * This daemon polls all started games and invokes ProcessExpiredTimersUseCase
 * for each one to handle expired deadlines.
 */
export class TimerPollingDaemon extends Context.Tag('TimerPollingDaemon')<
  TimerPollingDaemon,
  {
    /**
     * Start the polling daemon.
     * Returns when the daemon is stopped or an error occurs.
     */
    readonly start: () => Effect.Effect<void>;

    /**
     * Stop the polling daemon gracefully.
     */
    readonly stop: () => Effect.Effect<void>;
  }
>() {}

/**
 * Configuration for the timer polling daemon.
 */
export type TimerPollingDaemonConfig = {
  /**
   * How often to poll for expired timers (in milliseconds).
   * Default: 5000 (5 seconds)
   */
  readonly pollIntervalMs: number;
};

const defaultConfig: TimerPollingDaemonConfig = {
  pollIntervalMs: 5000,
};

/**
 * Live implementation of the timer polling daemon.
 */
export const makeTimerPollingDaemonLive = (
  config: Partial<TimerPollingDaemonConfig> = {},
) =>
  Layer.scoped(
    TimerPollingDaemon,
    Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const processExpiredTimersUseCase = yield* ProcessExpiredTimersUseCase;
      const scope = yield* Scope.Scope;

      const { pollIntervalMs } = { ...defaultConfig, ...config };

      let isRunning = false;
      let stopRequested = false;

      const processExpiredTimersForAllGames = Effect.gen(function* () {
        // Find all started games
        const startedGameIds = yield* gameRepository.findAllStartedGameIds();

        if (startedGameIds.length === 0) {
          return;
        }

        // Process each game
        for (const gameId of startedGameIds) {
          yield* processExpiredTimersUseCase
            .processExpiredTimers({ gameId })
            .pipe(
              Effect.catchAll((error) => {
                // Log error but continue processing other games
                console.error(
                  `[TimerPollingDaemon] Error processing game ${gameId}:`,
                  error,
                );
                return Effect.void;
              }),
            );
        }
      }).pipe(
        Effect.catchAll((error) => {
          // Log error but don't fail the daemon
          console.error(
            '[TimerPollingDaemon] Error finding started games:',
            error,
          );
          return Effect.void;
        }),
      );

      const pollLoop = Effect.gen(function* () {
        while (!stopRequested) {
          yield* processExpiredTimersForAllGames;
          yield* Effect.sleep(Duration.millis(pollIntervalMs));
        }
      });

      return {
        start: () =>
          Effect.gen(function* () {
            if (isRunning) {
              return; // Already running
            }

            isRunning = true;
            stopRequested = false;

            // Register cleanup on scope finalization
            yield* Scope.addFinalizer(
              scope,
              Effect.sync(() => {
                stopRequested = true;
                isRunning = false;
              }),
            );

            // Run the poll loop
            yield* pollLoop;
          }),

        stop: () =>
          Effect.sync(() => {
            stopRequested = true;
            isRunning = false;
          }),
      };
    }),
  );

/**
 * Default timer polling daemon with standard configuration.
 */
export const TimerPollingDaemonLive = makeTimerPollingDaemonLive();

/**
 * No-op implementation for testing.
 */
export const TimerPollingDaemonTest = Layer.succeed(TimerPollingDaemon, {
  start: () => Effect.void,
  stop: () => Effect.void,
});
