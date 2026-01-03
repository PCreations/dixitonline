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
import { gameViewProjectorTestSuite } from '../../test-suites/game-view-projector.test-suite.js';

const uuidIdFactory: IdFactory = {
  gameId,
  playerId,
  deckId,
};

describe('Acceptance (Drizzle): GameViewProjectorTestSuite', () => {
  beforeEach(async () => {
    const db = getTestDb();
    await db.delete(gamesTable);
  });

  gameViewProjectorTestSuite(makeGameDriverDrizzleLayer, uuidIdFactory);
});
