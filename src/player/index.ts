import { Layer } from "effect";
import { EnsurePlayerExistsUseCase } from "./ensure-player-exists.usecase.js";
import { DrizzlePlayerRepository } from "./infra/drizzle/drizzle-player.repository.js";
import { InMemoryPlayerRepository } from "./player.repository.js";

// Re-export public API
export { PlayerId, PlayerEntity, EmailAlreadyLinkedError } from "./player.entity.js";
export { PlayerRepository, OptimisticConcurrencyError } from "./player.repository.js";
export { EnsurePlayerExistsUseCase, type EnsurePlayerExistsCommand } from "./ensure-player-exists.usecase.js";

/**
 * Player layer without repository implementation
 * Requires PlayerRepository to be provided
 */
export const PlayerLayerWithoutDependencies = Layer.mergeAll(
  EnsurePlayerExistsUseCase.Default,
);

/**
 * Player layer with in-memory repository (for testing)
 */
export const PlayerLayerTest = PlayerLayerWithoutDependencies.pipe(
  Layer.provide(InMemoryPlayerRepository),
);

/**
 * Player layer with Drizzle repository (for production)
 * Requires Database to be provided
 */
export const PlayerLayerLive = PlayerLayerWithoutDependencies.pipe(
  Layer.provide(DrizzlePlayerRepository),
);
