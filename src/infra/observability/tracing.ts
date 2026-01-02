import { NodeSdk } from '@effect/opentelemetry';
import { SentrySpanProcessor } from '@sentry/opentelemetry';

/**
 * OpenTelemetry tracing layer for Effect.
 *
 * This layer integrates Effect's built-in tracing with Sentry via OpenTelemetry.
 * All spans created with Effect.withSpan will be sent to Sentry.
 *
 * Usage:
 * - Wrap Effects with Effect.withSpan("SpanName", { attributes: {...} })
 * - Spans are automatically nested (child spans inherit parent context)
 * - Sentry receives all spans for performance monitoring
 */
export const TracingLive = NodeSdk.layer(() => ({
  resource: {
    serviceName: 'tixid-online',
  },
  // SentrySpanProcessor is a SpanProcessor, not an exporter
  spanProcessor: new SentrySpanProcessor(),
}));
