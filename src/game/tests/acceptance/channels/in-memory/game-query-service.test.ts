import { Layer } from 'effect';
import { describe } from 'vitest';
import { InMemoryPlayerRepository } from '../../../../../player/player.repository.js';
import { ClockLive } from '../../../../clock.service.js';
import { InMemoryDeckRepository } from '../../../../deck.repository.js';
import { NoopRandomizeStrategy } from '../../../../game.entity.js';
import { GameQueryService } from '../../../../game.query-service.js';
import { InMemoryGameRepository } from '../../../../game.repository.js';
import { NoopGameEventBus } from '../../../../game-event-bus.js';
import { InMemoryGameView } from '../../../../game-view.js';
import {
  GameViewProjector,
  ShufflerService,
  TurnBoardCardsShuffler,
} from '../../../../game-view-projector.js';
import { makeGameDriverTestLayer } from '../../../game.driver.js';
import { gameQueryServiceTestSuite } from '../../test-suites/game-query-service.test-suite.js';

describe('Acceptance (In-Memory): GameQueryService', () => {
  const makeTestLayer = () => {
    // Create shared base dependencies (single instance of each repository)
    const sharedDependencies = Layer.mergeAll(
      InMemoryGameRepository,
      InMemoryDeckRepository,
      InMemoryGameView,
      TurnBoardCardsShuffler.Default,
      GameViewProjector.Default,
      ShufflerService.Default,
      NoopGameEventBus,
      NoopRandomizeStrategy,
      InMemoryPlayerRepository,
      ClockLive,
    );

    // Build the complete test layer with shared dependencies
    // GameDriver + GameQueryService both use the same repositories
    const baseLayer = makeGameDriverTestLayer({
      dependencies: sharedDependencies,
    });

    // Add GameQueryService using the same shared dependencies
    const queryServiceLayer = GameQueryService.Default.pipe(
      Layer.provide(sharedDependencies),
    );

    return Layer.merge(baseLayer, queryServiceLayer);
  };

  gameQueryServiceTestSuite(makeTestLayer);
});
