import { Layer } from "effect";
import { DrizzlePlayerRepository } from "../player/infra/drizzle/drizzle-player.repository.js";
import { CreateGameUseCase } from "./create-game.usecase.js";
import { InMemoryGameEventBus } from "./game-event-bus.js";
import { InMemoryGameView } from "./game-view.js";

// Re-export for use in server.ts
export { GameEventBus, type GameEvent } from "./game-event-bus.js";
import {
  GameViewProjector,
  ShufflerService,
  TurnBoardCardsShuffler,
} from "./game-view-projector.js";
import { NoopRandomizeStrategy } from "./game.entity.js";
import { DrizzleGameRepository } from "./infra/drizzle/drizzle-game.repository.js";
import { JsonDeckRepository } from "./infra/json/json-deck.repository.js";
import { JoinGameUseCase } from "./join-game.usecase.js";
import { LeaveGameUseCase } from "./leave-game.usecase.js";
import { LobbyQueryService } from "./lobby.query-service.js";
import { NotifyReadyForNextTurnUseCase } from "./notify-ready-for-next-turn.usecase.js";
import { SelectCardUseCase } from "./select-card.usecase.js";
import { StartGameUseCase } from "./start-game.usecase.js";
import { SubmitClueUseCase } from "./submit-clue.usecase.js";
import { VoteOnCardUseCase } from "./vote-on-card.usecase.js";

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
);

/**
 * Query services that need GameRepository and PlayerRepository
 */
const QueryServicesWithoutDependencies = Layer.mergeAll(
  LobbyQueryService.Default,
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
export const GameLayerLiveWithDependencies = Layer.mergeAll(
  GameLayerWithoutDependencies,
  QueryServicesWithoutDependencies,
).pipe(
  // First, provide the repository implementations
  Layer.provideMerge(DrizzleGameRepository),
  Layer.provideMerge(DrizzlePlayerRepository),
  Layer.provideMerge(JsonDeckRepository),
  Layer.provideMerge(InMemoryGameView),
  Layer.provideMerge(TurnBoardCardsShuffler.Default),
  Layer.provideMerge(ShufflerService.Default),
  Layer.provideMerge(NoopRandomizeStrategy),
  // Event bus for SSE notifications
  Layer.provideMerge(InMemoryGameEventBus),
  // Then add GameViewProjector which uses the deck repository
  Layer.provideMerge(GameViewProjector.Default),
);
