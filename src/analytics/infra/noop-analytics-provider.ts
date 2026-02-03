import { Effect, Layer } from 'effect';
import { AnalyticsProvider } from '../analytics-provider.js';

/**
 * No-op analytics provider for tests.
 * Silently discards all events.
 */
export const NoopAnalyticsProvider = Layer.succeed(AnalyticsProvider, {
  track: () => Effect.void,
});
