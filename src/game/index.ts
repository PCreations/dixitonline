import { Layer } from "effect";
import { CreateGameUseCase } from "./create-game.usecase.js";
import { JoinGameUseCase } from "./join-game.usecase.js";
import { LeaveGameUseCase } from "./leave-game.usecase.js";
import { StartGameUseCase } from "./start-game.usecase.js";

export const GameLayerLive = Layer.mergeAll(
  CreateGameUseCase.Default,
  JoinGameUseCase.Default,
  LeaveGameUseCase.Default,
  StartGameUseCase.Default,
);

export const GameLayerTest = Layer.mergeAll(
  CreateGameUseCase.DefaultWithoutDependencies,
  JoinGameUseCase.DefaultWithoutDependencies,
  LeaveGameUseCase.DefaultWithoutDependencies,
  StartGameUseCase.DefaultWithoutDependencies,
);
