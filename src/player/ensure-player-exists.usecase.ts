import { Effect, Option } from "effect";
import { PlayerId, PlayerEntity } from "./player.entity.js";
import { PlayerRepository } from "./player.repository.js";

// Command type
export interface EnsurePlayerExistsCommand {
  readonly playerId: PlayerId;
  readonly username: string | undefined;
  readonly isAnonymous: boolean;
}

// Use Case
export class EnsurePlayerExistsUseCase extends Effect.Service<EnsurePlayerExistsUseCase>()(
  "player/EnsurePlayerExistsUseCase",
  {
    effect: Effect.gen(function* () {
      const playerRepository = yield* PlayerRepository;

      return {
        /**
         * Ensures a player exists in the database for the given auth user.
         * Creates the player if not found, updates username if changed.
         */
        execute: (command: EnsurePlayerExistsCommand) =>
          Effect.gen(function* () {
            const maybePlayer = yield* playerRepository.findById(
              command.playerId,
            );

            return yield* Option.match(maybePlayer, {
              onNone: () =>
                Effect.gen(function* () {
                  // Create new player from auth data
                  const player = PlayerEntity.createFromAuth({
                    id: command.playerId,
                    username: command.username ?? "Anonyme",
                    isAnonymous: command.isAnonymous,
                  });
                  yield* playerRepository.save(player);
                  return player;
                }),
              onSome: (existingPlayer) =>
                Effect.gen(function* () {
                  // Check if username needs updating
                  const snapshot = existingPlayer.toSnapshot();
                  if (
                    command.username &&
                    snapshot.username !== command.username
                  ) {
                    const updated = existingPlayer.updateUsername(
                      command.username,
                    );
                    yield* playerRepository.save(updated);
                    return updated;
                  }
                  return existingPlayer;
                }),
            });
          }),
      };
    }),
    // No dependencies - PlayerRepository provided by layer composition
  },
) {}
