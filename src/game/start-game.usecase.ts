import { Effect, Option, Schedule } from "effect";
import {
  GameRepository,
  InMemoryGameRepository,
  OptimisticConcurrencyError,
} from "./game.repository.js";
import { PlayerId } from "./player.entity.js";

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

          return Effect.retry(startGameLogic, {
            while: (error) => {
              return error instanceof OptimisticConcurrencyError;
            },
            times: 3,
          });
        },
      };
    }),
    dependencies: [InMemoryGameRepository],
  },
) {}
