import { Effect, Option } from "effect";
import { GameEventBus } from "./game-event-bus.js";
import { GameRepository } from "./game.repository.js";
import { withOptimisticRetry } from "./optimistic-retry.js";
import { PlayerId } from "./player.entity.js";

export type JoinGameCommand = {
  gameId: string;
  playerId: string;
};

export class JoinGameUseCase extends Effect.Service<JoinGameUseCase>()(
  "game/JoinGameUseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const gameEventBus = yield* GameEventBus;

      return {
        joinGame: (props: JoinGameCommand) => {
          const joinGameLogic = Effect.gen(function* () {
            const game = yield* gameRepository.findNotStartedGameById(
              props.gameId,
            );

            return yield* Option.match(game, {
              onNone: () => Effect.fail(new Error("Game not found")),
              onSome: (gameEntity) =>
                Effect.gen(function* () {
                  const updatedGame = yield* gameEntity.addPlayer(
                    PlayerId(props.playerId),
                  );

                  yield* gameRepository.save(updatedGame);

                  // Notify subscribers that a player joined
                  yield* gameEventBus.publish({
                    type: "playerJoined",
                    gameId: props.gameId,
                    playerId: props.playerId,
                  });
                }),
            });
          });

          return withOptimisticRetry(joinGameLogic);
        },
      };
    }),
    // No dependencies - GameRepository and GameEventBus provided by layer composition
  },
) {}
