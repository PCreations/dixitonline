import { Effect, Option } from "effect";
import {
  GameRepository,
  InMemoryGameRepository,
} from "./game.repository.js";
import { PlayerId } from "./player.entity.js";
import { withOptimisticRetry } from "./optimistic-retry.js";

export type StartGameCommand = {
  gameId: string;
  playerId: string;
};

export class StartGameUseCase extends Effect.Service<StartGameUseCase>()(
  "game/StartGameUseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;

      return {
        startGame: (props: StartGameCommand) => {
          const startGameLogic = Effect.gen(function* () {
            const game = yield* gameRepository.findById(props.gameId);

            return yield* Option.match(game, {
              onNone: () => Effect.fail(new Error("Game not found")),
              onSome: (gameEntity) =>
                Effect.gen(function* () {
                  const updatedGame = yield* gameEntity.start(
                    PlayerId(props.playerId),
                  );

                  yield* gameRepository.save(updatedGame);
                }),
            });
          });

          return withOptimisticRetry(startGameLogic);
        },
      };
    }),
    dependencies: [InMemoryGameRepository],
  },
) {}
