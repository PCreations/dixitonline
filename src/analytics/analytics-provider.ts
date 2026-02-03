import { Context, Effect } from 'effect';

/**
 * Analytics event to track.
 * Uses Firebase-compatible naming conventions:
 * - Event names: snake_case, max 40 characters
 * - Parameter names: snake_case, max 40 characters
 * - Parameter values: strings max 100 chars, numbers, or booleans
 */
export type AnalyticsEvent = {
  readonly name: string;
  readonly params: Record<string, string | number | boolean>;
};

/**
 * Abstraction for analytics providers.
 * Implementations: Firebase (production), Console (dev), Noop (tests).
 *
 * Analytics tracking is fire-and-forget: errors are logged but never
 * propagate to callers. This ensures analytics never affects gameplay.
 */
export class AnalyticsProvider extends Context.Tag('AnalyticsProvider')<
  AnalyticsProvider,
  {
    readonly track: (event: AnalyticsEvent) => Effect.Effect<void>;
  }
>() {}
