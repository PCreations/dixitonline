import { describe } from 'vitest';
import { makeGameDriverTestLayer } from '../../../game.driver.js';
import { joinGameTestSuite } from '../../test-suites/join-game.test-suite.js';

describe('Acceptance (In-Memory): JoinGameTestSuite', () => {
  joinGameTestSuite(makeGameDriverTestLayer);
});
