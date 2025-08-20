import { Effect, Option, Schedule } from "effect";
import {
  GameRepository,
  InMemoryGameRepository,
  OptimisticConcurrencyError,
} from "./game.repository.js";
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

      return {
        joinGame: (props: JoinGameCommand) => {
          const joinGameLogic = Effect.gen(function* () {
            const game = yield* gameRepository.findById(props.gameId);

            return yield* Option.match(game, {
              onNone: () => Effect.fail(new Error("Game not found")),
              onSome: (gameEntity) =>
                Effect.gen(function* () {
                  const updatedGame = yield* gameEntity.addPlayer(
                    PlayerId(props.playerId),
                  );

                  yield* gameRepository.save(updatedGame);
                }),
            });
          });

          return Effect.retry(joinGameLogic, {
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
