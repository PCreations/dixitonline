import { describe } from 'vitest';
import { makeGameDriverTestLayer } from '../../../game.driver.js';
import { startGameTestSuite } from '../../test-suites/start-game.test-suite.js';

describe('Acceptance (In-Memory): StartGameTestSuite', () => {
  startGameTestSuite(makeGameDriverTestLayer);
});
