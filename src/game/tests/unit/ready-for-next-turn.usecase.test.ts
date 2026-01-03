import { describe } from 'vitest';
import { makeGameDriverTestLayer } from '../game.driver.js';
import { readyForNextTurnTestSuite } from '../test-suites/ready-for-next-turn.test-suite.js';

describe('Unit: ReadyForNextTurnTestSuite', () => {
  readyForNextTurnTestSuite(makeGameDriverTestLayer);
});
