import * as Sentry from '@sentry/node';
import { Cause, Effect } from 'effect';

/**
 * Walk the JavaScript error cause chain and collect all error messages.
 * This ensures the full error chain is visible in Sentry.
 */
const getFullErrorChain = (error: unknown): Error => {
  if (!(error instanceof Error)) {
    return new Error(String(error));
  }

  // Walk the cause chain to build a comprehensive message
  const messages: string[] = [];
  let current: unknown = error;
  let depth = 0;
  const maxDepth = 10; // Prevent infinite loops

  while (current instanceof Error && depth < maxDepth) {
    const indent = '  '.repeat(depth);
    const prefix = depth === 0 ? '' : `${indent}Caused by: `;
    messages.push(`${prefix}${current.name}: ${current.message}`);
    current = current.cause;
    depth++;
  }

  // Create a new error with the full chain in the message
  // but keep the original error as the cause for Sentry's LinkedErrors
  const fullError = new Error(messages.join('\n'), { cause: error });
  fullError.name = error.name;
  if (error.stack) {
    fullError.stack = error.stack;
  }

  return fullError;
};

/**
 * Extract all errors from an Effect Cause and report them to Sentry.
 * This is the idiomatic Effect way to integrate with error reporting.
 *
 * The Cause structure contains:
 * - Fail: typed errors from Effect.fail
 * - Die: unexpected errors (defects)
 * - Interrupt: fiber interruptions
 *
 * We extract actual errors and report them with their full cause chain.
 */
const captureEffectCause = <E>(cause: Cause.Cause<E>): void => {
  // Get all failures (typed errors)
  const failures = Cause.failures(cause);
  for (const failure of failures) {
    if (failure instanceof Error) {
      Sentry.captureException(getFullErrorChain(failure));
    } else {
      Sentry.captureMessage(`Effect failure: ${String(failure)}`, 'error');
    }
  }

  // Get all defects (unexpected errors)
  const defects = Cause.defects(cause);
  for (const defect of defects) {
    if (defect instanceof Error) {
      Sentry.captureException(getFullErrorChain(defect));
    } else {
      Sentry.captureMessage(`Effect defect: ${String(defect)}`, 'error');
    }
  }
};

/**
 * Wrap an Effect to capture errors to Sentry before they bubble up.
 * This should be used at the boundary where Effects are run (e.g., in HTTP handlers).
 *
 * Usage:
 * ```ts
 * await runtime.runPromise(
 *   myEffect.pipe(withSentryErrorCapture)
 * );
 * ```
 */
export const withSentryErrorCapture = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> =>
  effect.pipe(
    Effect.tapErrorCause((cause) =>
      Effect.sync(() => {
        captureEffectCause(cause);
      }),
    ),
  );

/**
 * Wrap an Effect with an HTTP span to create a parent transaction.
 * All child spans (use cases, repositories) will be nested under this HTTP span.
 *
 * Usage:
 * ```ts
 * await runtime.runPromise(
 *   myEffect.pipe(withHttpSpan({ method: 'GET', url: '/game/123' }))
 * );
 * ```
 */
export const withHttpSpan =
  (request: { method: string; url: string }) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.gen(function* () {
      yield* Effect.annotateCurrentSpan('context.input', JSON.stringify({
        method: request.method,
        url: request.url,
      }));

      const result = yield* effect;

      yield* Effect.annotateCurrentSpan('context.output', 'no data');

      return result;
    }).pipe(
      Effect.withSpan(`HTTP ${request.method} ${request.url}`, {
        attributes: {
          'http.method': request.method,
          'http.url': request.url,
        },
      }),
    );
