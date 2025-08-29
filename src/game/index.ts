import { Layer } from "effect";
import { CreateGameUseCase } from "./create-game.usecase.js";
import { JoinGameUseCase } from "./join-game.usecase.js";
import { LeaveGameUseCase } from "./leave-game.usecase.js";
import { SelectCardUseCase } from "./select-card.usecase.js";
import { StartGameUseCase } from "./start-game.usecase.js";
import { SubmitClueUseCase } from "./submit-clue.usecase.js";

export const GameLayerLive = Layer.mergeAll(
  CreateGameUseCase.Default,
  JoinGameUseCase.Default,
  LeaveGameUseCase.Default,
  StartGameUseCase.Default,
  SubmitClueUseCase.Default,
  SelectCardUseCase.Default,
);

export const GameLayerWithoutDependencies = Layer.mergeAll(
  CreateGameUseCase.DefaultWithoutDependencies,
  JoinGameUseCase.DefaultWithoutDependencies,
  LeaveGameUseCase.DefaultWithoutDependencies,
  StartGameUseCase.DefaultWithoutDependencies,
  SubmitClueUseCase.DefaultWithoutDependencies,
  SelectCardUseCase.DefaultWithoutDependencies,
);
