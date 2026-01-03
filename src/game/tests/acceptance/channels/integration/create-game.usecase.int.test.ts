import { beforeEach, describe } from 'vitest';
import { gamesTable } from '../../../../../infra/db/schema.js';
import { getTestDb } from '../../../../../shared/tests/setup/test-db.js';
import {
  deckId,
  gameId,
  playerId,
} from '../../../../../shared/tests/uuid-test-helper.js';
import { makeGameDriverDrizzleLayer } from '../../../game.driver.js';
import {
  createGameTestSuite,
  type IdFactory,
} from '../../test-suites/create-game.test-suite.js';

/**
 * UUID factory for integration tests.
 * Generates valid UUIDs required by PostgreSQL.
 */
const uuidIdFactory: IdFactory = {
  gameId,
  playerId,
  deckId,
};

describe('Acceptance (Drizzle): CreateGameTestSuite', () => {
  beforeEach(async () => {
    const db = getTestDb();
    await db.delete(gamesTable);
  });

  createGameTestSuite(makeGameDriverDrizzleLayer, uuidIdFactory);
});
