import { Layer } from 'effect';
import { CheckUsernameAvailabilityUseCase } from './check-username-availability.usecase.js';
import { EnsurePlayerExistsUseCase } from './ensure-player-exists.usecase.js';
import { DrizzlePlayerRepository } from './infra/drizzle/drizzle-player.repository.js';
import { InMemoryPlayerRepository } from './player.repository.js';

export { CheckUsernameAvailabilityUseCase } from './check-username-availability.usecase.js';
export {
  type EnsurePlayerExistsCommand,
  EnsurePlayerExistsUseCase,
} from './ensure-player-exists.usecase.js';
// Re-export public API
export {
  EmailAlreadyLinkedError,
  PlayerEntity,
  PlayerId,
} from './player.entity.js';
export {
  OptimisticConcurrencyError,
  PlayerRepository,
  UsernameAlreadyTakenError,
} from './player.repository.js';

/**
 * Player layer without repository implementation
 * Requires PlayerRepository to be provided
 */
export const PlayerLayerWithoutDependencies = Layer.mergeAll(
  EnsurePlayerExistsUseCase.Default,
  CheckUsernameAvailabilityUseCase.Default,
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
