import { Effect, Layer } from 'effect';
import { AnalyticsProvider, type AnalyticsEvent } from '../analytics-provider.js';

/**
 * Firebase Analytics provider using the Measurement Protocol (GA4).
 *
 * Requires environment variables:
 * - FIREBASE_MEASUREMENT_ID: Your GA4 measurement ID (e.g., "G-XXXXXXXXXX")
 * - FIREBASE_API_SECRET: Your Measurement Protocol API secret
 *
 * @see https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */
export const FirebaseAnalyticsProvider = Layer.succeed(
  AnalyticsProvider,
  {
    track: (event: AnalyticsEvent) =>
      Effect.gen(function* () {
        const measurementId = process.env.FIREBASE_MEASUREMENT_ID;
        const apiSecret = process.env.FIREBASE_API_SECRET;

        if (!measurementId || !apiSecret) {
          console.warn(
            '[FirebaseAnalytics] Missing FIREBASE_MEASUREMENT_ID or FIREBASE_API_SECRET',
          );
          return;
        }

        yield* Effect.tryPromise(async () => {
          const response = await fetch(
            `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                client_id: String(event.params.player_id ?? 'server'),
                events: [
                  {
                    name: event.name,
                    params: event.params,
                  },
                ],
              }),
            },
          );

          if (!response.ok) {
            console.warn(
              `[FirebaseAnalytics] Failed to send event: ${response.status}`,
            );
          }
        });
      }).pipe(
        Effect.catchAll((error) => {
          console.error('[FirebaseAnalytics] Error tracking event:', error);
          return Effect.void;
        }),
        Effect.withSpan('FirebaseAnalyticsProvider.track'),
      ),
  },
);
