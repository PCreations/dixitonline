import { describe } from 'vitest';
import { makeGameDriverTestLayer } from '../game.driver.js';
import { joinGameTestSuite } from '../test-suites/join-game.test-suite.js';

describe('Unit: JoinGameTestSuite', () => {
  joinGameTestSuite(makeGameDriverTestLayer);
});
