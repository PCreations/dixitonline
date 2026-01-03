import { describe } from 'vitest';
import { makeGameDriverTestLayer } from '../../../game.driver.js';
import { voteOnCardTestSuite } from '../../test-suites/vote-on-card.test-suite.js';

describe('Acceptance (In-Memory): VoteOnCardTestSuite', () => {
  voteOnCardTestSuite(makeGameDriverTestLayer);
});
