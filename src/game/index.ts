import { Layer } from "effect";
import { CreateGameUseCase } from "./create-game.usecase.js";
import { InMemoryGameView } from "./game-view.js";
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
  JoinGameUseCase.DefaultWithoutDependencies,
  LeaveGameUseCase.DefaultWithoutDependencies,
  StartGameUseCase.DefaultWithoutDependencies,
  SubmitClueUseCase.DefaultWithoutDependencies,
  SelectCardUseCase.DefaultWithoutDependencies,
  VoteOnCardUseCase.DefaultWithoutDependencies,
  NotifyReadyForNextTurnUseCase.DefaultWithoutDependencies,
);

/**
 * Complete game layer with all dependencies including database
 * This layer requires Database to be provided
 *
 * The layer structure is:
 * 1. Use cases (without baked-in dependencies) - requires GameRepository, DeckRepository
 * 2. DrizzleGameRepository - provides GameRepository (requires Database)
 * 3. JsonDeckRepository - provides DeckRepository (loads deck from JSON config)
 * 4. Other services - GameViewProjector, TurnBoardCardsShuffler, etc.
 *
 * Using Layer.provideMerge ensures dependencies are properly wired.
 */
export const GameLayerLiveWithDependencies = GameLayerWithoutDependencies.pipe(
  // First, provide the repository implementations
  Layer.provideMerge(DrizzleGameRepository),
  Layer.provideMerge(JsonDeckRepository),
  Layer.provideMerge(InMemoryGameView),
  Layer.provideMerge(TurnBoardCardsShuffler.Default),
  Layer.provideMerge(ShufflerService.Default),
  Layer.provideMerge(NoopRandomizeStrategy),
  // Then add GameViewProjector which uses the deck repository
  Layer.provideMerge(GameViewProjector.Default),
);
