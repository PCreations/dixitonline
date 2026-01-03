import { describe } from 'vitest';
import { makeGameDriverTestLayer } from '../../../game.driver.js';
import { gameScenariosTestSuite } from '../../test-suites/game-scenarios.test-suite.js';

describe('Acceptance (In-Memory): GameScenariosTestSuite', () => {
  gameScenariosTestSuite(makeGameDriverTestLayer);
});
