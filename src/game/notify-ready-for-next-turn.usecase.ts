import { Effect, Option } from "effect";
import { CardId } from "./deck.entity.js";
import { GameRepository, InMemoryGameRepository } from "./game.repository.js";
import { withOptimisticRetry } from "./optimistic-retry.js";
import { PlayerId } from "./player.entity.js";

export type NotifyReadyForNextTurnCommand = {
  gameId: string;
  playerId: string;
};

export class NotifyReadyForNextTurnUseCase
  extends Effect.Service<NotifyReadyForNextTurnUseCase>()(
    "game/NotifyReadyForNextTurnUseCase",
    {
      effect: Effect.gen(function* () {
        const gameRepository = yield* GameRepository;

        return {
          notifyReadyForNextTurn: (props: NotifyReadyForNextTurnCommand) => {
            const notifyReadyForNextTurnLogic = Effect.gen(function* () {
              const game = yield* gameRepository.findStartedGameById(
                props.gameId,
              );

              return yield* Option.match(game, {
                onNone: () => Effect.fail(new Error("Game not found")),
                onSome: (gameEntity) =>
                  Effect.gen(function* () {
                    const updatedGame = yield* gameEntity
                      .notifyReadyForNextTurn({
                        playerId: PlayerId(props.playerId),
                      });

                    yield* gameRepository.save(updatedGame);
                  }),
              });
            });

            return withOptimisticRetry(notifyReadyForNextTurnLogic);
          },
        };
      }),
      dependencies: [InMemoryGameRepository],
    },
  ) {}
