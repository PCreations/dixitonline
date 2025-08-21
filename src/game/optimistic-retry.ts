import { Effect } from 'effect';
import { OptimisticConcurrencyError } from './game.repository.js';

/**
 * Wraps an Effect operation with retry logic for OptimisticConcurrencyError
 * @param operation The Effect operation that may fail with OptimisticConcurrencyError
 * @param maxRetries Number of retry attempts (default: 3)
 * @returns The operation wrapped with retry logic
 */
export function withOptimisticRetry<A, E, R>(
  operation: Effect.Effect<A, E, R>,
  maxRetries: number = 3
): Effect.Effect<A, E, R> {
  return Effect.retry(operation, {
    while: (error) => error instanceof OptimisticConcurrencyError,
    times: maxRetries,
  });
}