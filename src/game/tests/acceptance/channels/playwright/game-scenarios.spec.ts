/**
 * Playwright E2E Tests: Game Scenarios
 *
 * Full game scenarios that test the complete game flow through the UI.
 * Uses shared test cases from game-scenarios.test-cases.ts.
 */

import { test } from '@playwright/test';
import { Effect } from 'effect';

import {
  deckId,
  gameId,
  playerId,
} from '../../../../../shared/tests/uuid-test-helper.js';
import { GameDriver } from '../../../game-driver.interface.js';
import { gameScenariosTestCases } from '../../test-cases/game-scenarios.test-cases.js';
import type { IdFactory } from '../../test-suites/create-game.test-suite.js';
import { makePlaywrightGameDriver } from './playwright-game.driver.js';
import { resetDatabase } from './playwright-test-utils.js';

/**
 * Creates a UUID factory with an offset to ensure unique IDs across tests.
 */
const createUuidIdFactory = (testIndex: number): IdFactory => {
  const offset = testIndex * 100;
  return {
    gameId: (id) => gameId(Number(id) + offset),
    playerId: (id) => playerId(String(id)),
    deckId: (id) => deckId(Number(id) + offset),
  };
};

test.describe('E2E: Game Scenarios', () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  let testIndex = 0;
  for (const testCase of gameScenariosTestCases) {
    const currentTestIndex = testIndex++;

    if (testCase.skipChannels?.includes('playwright')) {
      test.skip(`Scenario: ${testCase.name}`, () => {
        // Test skipped - feature not available in UI
      });
      continue;
    }

    test(`Scenario: ${testCase.name}`, async ({ page }) => {
      // Capture console errors for debugging
      const consoleErrors: Array<string> = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      page.on('pageerror', (err) => {
        consoleErrors.push(`Page error: ${err.message}`);
      });

      const driver = makePlaywrightGameDriver(page);
      const uuidIdFactory = createUuidIdFactory(currentTestIndex);

      try {
        await Effect.runPromise(
          testCase.program(uuidIdFactory).pipe(
            Effect.provideService(
              GameDriver,
              // biome-ignore lint/suspicious/noExplicitAny: E2E driver is structurally compatible
              driver as any,
            ),
          ),
        );
      } finally {
        if (consoleErrors.length > 0) {
          console.log('Console errors captured:', consoleErrors);
        }
      }
    });
  }
});
