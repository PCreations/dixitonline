import { describe } from 'vitest';
import { makeGameDriverTestLayer } from '../game.driver.js';
import { selectCardTestSuite } from '../test-suites/select-card.test-suite.js';

describe('Unit: SelectCardTestSuite', () => {
  selectCardTestSuite(makeGameDriverTestLayer);
});
