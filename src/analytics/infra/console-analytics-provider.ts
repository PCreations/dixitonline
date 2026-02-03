import { Effect, Layer } from 'effect';
import { AnalyticsProvider, type AnalyticsEvent } from '../analytics-provider.js';

/**
 * Console analytics provider for development.
 * Logs all analytics events to the console for debugging.
 */
export const ConsoleAnalyticsProvider = Layer.succeed(AnalyticsProvider, {
  track: (event: AnalyticsEvent) =>
    Effect.sync(() => {
      console.log('[Analytics]', event.name, JSON.stringify(event.params));
    }),
});
