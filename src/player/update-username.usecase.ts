import { Data, Effect } from 'effect';
import { PlayerId } from './player.entity.js';
import { PlayerRepository } from './player.repository.js';

export class PlayerNotFoundError extends Data.TaggedError(
  'PlayerNotFoundError',
)<{
  readonly playerId: PlayerId;
}> {}

export interface UpdateUsernameCommand {
  readonly playerId: PlayerId;
  readonly newUsername: string;
}

export class UpdateUsernameUseCase extends Effect.Service<UpdateUsernameUseCase>()(
  'player/UpdateUsernameUseCase',
  {
    effect: Effect.gen(function* () {
      const playerRepository = yield* PlayerRepository;

      return {
        execute: (command: UpdateUsernameCommand) =>
          Effect.gen(function* () {
            const { playerId, newUsername } = command;

            // Load the player
            const maybePlayer = yield* playerRepository.findById(playerId);

            const player = yield* maybePlayer.pipe(
              Effect.mapError(() => new PlayerNotFoundError({ playerId })),
            );

            // Update the username (returns same instance if no change)
            const updatedPlayer = player.updateUsername(newUsername);

            // If no change, return early
            if (updatedPlayer === player) {
              return { success: true as const };
            }

            // Save will fail with UsernameAlreadyTakenError if username is taken
            yield* playerRepository.save(updatedPlayer);

            return { success: true as const };
          }),
      };
    }),
    dependencies: [],
  },
) {}
