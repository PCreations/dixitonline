import { describe } from 'vitest';
import { makeGameDriverTestLayer } from '../game.driver.js';
import { leaveGameTestSuite } from '../test-suites/leave-game.test-suite.js';

describe('Unit: LeaveGameTestSuite', () => {
  leaveGameTestSuite(makeGameDriverTestLayer);
});
