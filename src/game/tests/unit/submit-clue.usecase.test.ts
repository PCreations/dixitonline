import { describe } from 'vitest';
import { makeGameDriverTestLayer } from '../game.driver.js';
import { submitClueTestSuite } from '../test-suites/submit-clue.test-suite.js';

describe('Unit: SubmitClueTestSuite', () => {
  submitClueTestSuite(makeGameDriverTestLayer);
});
