import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import type { GameDriverLayer } from '../../game.driver.js';
import { createGameTestCases } from '../test-cases/create-game.test-cases.js';

/**
 * ID Factory for generating test IDs.
 * - For unit tests (in-memory): use simple string IDs
 * - For integration tests (Drizzle/PostgreSQL): use UUIDs
 */
export interface IdFactory {
  gameId: (id: string | number) => string;
  playerId: (id: string | number) => string;
  deckId: (id: string | number) => string;
}

/**
 * Default ID factory that generates simple string IDs.
 * Suitable for unit tests with in-memory repositories.
 */
export const defaultIdFactory: IdFactory = {
  gameId: (id) => `id-game-${id}`,
  playerId: (id) => `id-player-${id}`,
  deckId: (id) => `id-deck-${id}`,
};

/**
 * Test suite for creating a new game.
 *
 * This suite uses shared test cases from create-game.test-cases.ts
 * and wraps them with vitest's it.effect() runner.
 *
 * @param makeGameDriverTestLayer - Factory function returning a GameDriverLayer
 * @param idFactory - ID factory for generating test IDs (default: simple strings)
 */
export const createGameTestSuite = (
  makeGameDriverTestLayer: () => GameDriverLayer,
  idFactory: IdFactory = defaultIdFactory,
) => {
  describe('Feature: Creating a new game', () => {
    for (const testCase of createGameTestCases) {
      // Skip tests that are not supported by this channel
      // (in-memory and drizzle support all tests)

      it.effect(`Example: ${testCase.name}`, () => {
        return testCase
          .program(idFactory)
          .pipe(Effect.provide(makeGameDriverTestLayer()));
      });
    }
  });
};
