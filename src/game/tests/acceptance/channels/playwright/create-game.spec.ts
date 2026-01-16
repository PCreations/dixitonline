/**
 * Playwright E2E Tests: Create Game
 *
 * This test file uses shared test cases from create-game.test-cases.ts
 * and runs them with the Playwright driver through the actual UI.
 *
 * Test cases that are not supported via UI (e.g., custom deck selection)
 * are automatically skipped via the skipChannels property.
 */

import { test } from '@playwright/test';
import { Effect } from 'effect';

import {
  deckId,
  gameId,
  playerId,
} from '../../../../../shared/tests/uuid-test-helper.js';
import { GameDriver } from '../../../game-driver.interface.js';
import { createGameTestCases } from '../../test-cases/create-game.test-cases.js';
import type { IdFactory } from '../../test-suites/create-game.test-suite.js';
import { makePlaywrightGameDriver } from './playwright-game.driver.js';
import { resetDatabase } from './playwright-test-utils.js';

/**
 * Creates a UUID factory with an offset to ensure unique IDs across tests.
 * Each test gets its own "namespace" by offsetting the base ID.
 */
const createUuidIdFactory = (testIndex: number): IdFactory => {
  const offset = testIndex * 100;
  return {
    gameId: (id) => gameId(Number(id) + offset),
    playerId: (id) => playerId(Number(id) + offset),
    deckId: (id) => deckId(Number(id) + offset),
  };
};

test.describe('E2E: Create Game', () => {
  // Reset game data before each test (but not auth users, as sessions persist)
  test.beforeEach(async () => {
    await resetDatabase();
  });

  let testIndex = 0;
  for (const testCase of createGameTestCases) {
    const currentTestIndex = testIndex++;

    // Skip tests that are not supported via Playwright
    if (testCase.skipChannels?.includes('playwright')) {
      test.skip(`Example: ${testCase.name}`, () => {
        // Test skipped - feature not available in UI
      });
      continue;
    }

    test(`Example: ${testCase.name}`, async ({ page }) => {
      const driver = makePlaywrightGameDriver(page);
      // Each test gets unique IDs to avoid conflicts with persistent auth users
      const uuidIdFactory = createUuidIdFactory(currentTestIndex);

      // Run the test program with the Playwright driver
      // Cast is needed because PlaywrightGameDriverDSL uses Error
      // while GameDriverDSL uses DriverError, but they are structurally compatible
      await Effect.runPromise(
        testCase.program(uuidIdFactory).pipe(
          Effect.provideService(
            GameDriver,
            // biome-ignore lint/suspicious/noExplicitAny: E2E driver is structurally compatible
            driver as any,
          ),
        ),
      );
    });
  }
});
