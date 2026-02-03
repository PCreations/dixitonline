import { Layer } from 'effect';
import { DrizzlePlayerRepository } from '../player/infra/drizzle/drizzle-player.repository.js';
import { CreateGameUseCase } from './create-game.usecase.js';
import { InMemoryGameEventBus } from './game-event-bus.js';
import { InMemoryGameView } from './game-view.js';

export { RandomShufflerLayer } from './deterministic-shuffler.js';
// Re-export for use in server.ts
export { type GameEvent, GameEventBus } from './game-event-bus.js';

import { NoopRandomizeStrategy } from './game.entity.js';
import { GameQueryService } from './game.query-service.js';
import {
  GameViewProjector,
  TurnBoardCardsShuffler,
} from './game-view-projector.js';
import { DrizzleGameRepository } from './infra/drizzle/drizzle-game.repository.js';
import { JsonDeckRepository } from './infra/json/json-deck.repository.js';
import { JoinGameUseCase } from './join-game.usecase.js';
import { LeaveGameUseCase } from './leave-game.usecase.js';
import { LobbyQueryService } from './lobby.query-service.js';
import { NotifyReadyForNextTurnUseCase } from './notify-ready-for-next-turn.usecase.js';
import { ProcessExpiredTimersUseCase } from './process-expired-timers.usecase.js';
import { SelectCardUseCase } from './select-card.usecase.js';
import { StartGameUseCase } from './start-game.usecase.js';
import { SubmitClueUseCase } from './submit-clue.usecase.js';
import { VoteOnCardUseCase } from './vote-on-card.usecase.js';

export const GameLayerLive = Layer.mergeAll(
  CreateGameUseCase.Default,
  JoinGameUseCase.Default,
  LeaveGameUseCase.Default,
  StartGameUseCase.Default,
  SubmitClueUseCase.Default,
  SelectCardUseCase.Default,
  VoteOnCardUseCase.Default,
  NotifyReadyForNextTurnUseCase.Default,
);

export const GameLayerWithoutDependencies = Layer.mergeAll(
  CreateGameUseCase.DefaultWithoutDependencies,
  JoinGameUseCase.Default, // No baked-in dependencies, .Default requires GameRepository
  LeaveGameUseCase.DefaultWithoutDependencies,
  StartGameUseCase.DefaultWithoutDependencies,
  SubmitClueUseCase.DefaultWithoutDependencies,
  SelectCardUseCase.DefaultWithoutDependencies,
  VoteOnCardUseCase.DefaultWithoutDependencies,
  NotifyReadyForNextTurnUseCase.DefaultWithoutDependencies,
  ProcessExpiredTimersUseCase.DefaultWithoutDependencies,
);

/**
 * Query services that need GameRepository and PlayerRepository
 */
const QueryServicesWithoutDependencies = Layer.mergeAll(
  LobbyQueryService.Default,
  GameQueryService.Default,
);

/**
 * GameViewProjector composed with its dependencies.
 * Uses JsonDeckRepository for production (instead of InMemoryDeckRepository for tests).
 * ShufflerService must be provided externally (RandomShufflerLayer in server.ts for production).
 */
const GameViewProjectorWithJsonDeck =
  GameViewProjector.DefaultWithoutDependencies.pipe(
    Layer.provide(TurnBoardCardsShuffler.Default),
    Layer.provide(JsonDeckRepository),
  );

/**
 * Complete game layer with all dependencies including database
 * This layer requires Database to be provided
 *
 * The layer structure is:
 * 1. Use cases (without baked-in dependencies) - requires GameRepository, DeckRepository
 * 2. Query services (without baked-in dependencies) - requires GameRepository, PlayerRepository
 * 3. DrizzleGameRepository - provides GameRepository (requires Database)
 * 4. DrizzlePlayerRepository - provides PlayerRepository (requires Database)
 * 5. JsonDeckRepository - provides DeckRepository (loads deck from JSON config)
 * 6. Other services - GameViewProjector, TurnBoardCardsShuffler, etc.
 *
 * Using Layer.provideMerge ensures dependencies are properly wired.
 */
export const GameLayerLiveWithoutEventBus = Layer.mergeAll(
  GameLayerWithoutDependencies,
  QueryServicesWithoutDependencies,
).pipe(
  // First, provide the repository implementations
  Layer.provideMerge(DrizzleGameRepository),
  Layer.provideMerge(DrizzlePlayerRepository),
  Layer.provideMerge(JsonDeckRepository),
  Layer.provideMerge(InMemoryGameView),
  Layer.provideMerge(TurnBoardCardsShuffler.Default),
  Layer.provideMerge(NoopRandomizeStrategy),
  // Add GameViewProjector with its dependencies pre-wired
  // Note: ShufflerService must be provided externally (RandomShufflerLayer in server.ts)
  Layer.provideMerge(GameViewProjectorWithJsonDeck),
);

/**
 * Complete game layer including InMemoryGameEventBus.
 * Use GameLayerLiveWithoutEventBus if you need to provide a shared GameEventBus.
 */
export const GameLayerLiveWithDependencies = GameLayerLiveWithoutEventBus.pipe(
  // Event bus for SSE notifications
  Layer.provideMerge(InMemoryGameEventBus),
);

// Re-export for use when sharing GameEventBus across multiple services
export { InMemoryGameEventBus } from './game-event-bus.js';
