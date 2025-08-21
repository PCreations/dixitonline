import { Effect, Option } from "effect";
import {
  GameRepository,
  InMemoryGameRepository,
} from "./game.repository.js";
import { PlayerId } from "./player.entity.js";
import { withOptimisticRetry } from "./optimistic-retry.js";

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

          return withOptimisticRetry(joinGameLogic);
        },
      };
    }),
    dependencies: [InMemoryGameRepository],
  },
) {}
