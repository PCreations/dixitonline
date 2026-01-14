import { Effect } from 'effect';
import { PlayerRepository } from './player.repository.js';

export class CheckUsernameAvailabilityUseCase extends Effect.Service<CheckUsernameAvailabilityUseCase>()(
  'player/CheckUsernameAvailabilityUseCase',
  {
    effect: Effect.gen(function* () {
      const playerRepository = yield* PlayerRepository;

      return {
        execute: (username: string) =>
          Effect.gen(function* () {
            const exists = yield* playerRepository.existsByUsername(username);
            return { available: !exists };
          }),
      };
    }),
    dependencies: [],
  },
) {}
