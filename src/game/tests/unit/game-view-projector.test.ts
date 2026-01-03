import { describe } from 'vitest';
import { makeGameDriverTestLayer } from '../game.driver.js';
import { gameViewProjectorTestSuite } from '../test-suites/game-view-projector.test-suite.js';

describe('Unit: GameViewProjectorTestSuite', () => {
  gameViewProjectorTestSuite(makeGameDriverTestLayer);
});
