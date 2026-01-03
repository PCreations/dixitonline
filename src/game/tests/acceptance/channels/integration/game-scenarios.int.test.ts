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
import { gameScenariosTestSuite } from '../../test-suites/game-scenarios.test-suite.js';

const uuidIdFactory: IdFactory = {
  gameId,
  playerId,
  deckId,
};

describe('Acceptance (Drizzle): GameScenariosTestSuite', () => {
  beforeEach(async () => {
    const db = getTestDb();
    await db.delete(gamesTable);
  });

  gameScenariosTestSuite(makeGameDriverDrizzleLayer, uuidIdFactory);
});
