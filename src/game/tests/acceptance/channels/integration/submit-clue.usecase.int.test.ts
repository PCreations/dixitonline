import { beforeEach, describe } from 'vitest';
import { gamesTable } from '../../../../../infra/db/schema.js';
import { getTestDb } from '../../../../../shared/tests/setup/test-db.js';
import {
  deckId,
  gameId,
  playerId,
} from '../../../../../shared/tests/uuid-test-helper.js';
import { makeGameDriverDrizzleLayer } from '../../../game.driver.js';
import type { IdFactory } from '../../test-suites/create-game.test-suite.js';
import { submitClueTestSuite } from '../../test-suites/submit-clue.test-suite.js';

const uuidIdFactory: IdFactory = {
  gameId,
  playerId,
  deckId,
};

describe('Acceptance (Drizzle): SubmitClueTestSuite', () => {
  beforeEach(async () => {
    const db = getTestDb();
    await db.delete(gamesTable);
  });

  submitClueTestSuite(makeGameDriverDrizzleLayer, uuidIdFactory);
});
