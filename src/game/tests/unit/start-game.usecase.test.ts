import { describe } from 'vitest';
import { makeGameDriverTestLayer } from '../game.driver.js';
import { startGameTestSuite } from '../test-suites/start-game.test-suite.js';

describe('Unit: StartGameTestSuite', () => {
  startGameTestSuite(makeGameDriverTestLayer);
});
