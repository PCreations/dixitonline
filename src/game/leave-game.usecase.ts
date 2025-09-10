import { Effect, Option } from "effect";
import { InMemoryDeckRepository } from "./deck.repository.js";
import { isStartedGame } from "./game.entity.js";
import { GameRepository, InMemoryGameRepository } from "./game.repository.js";
import { GameView, InMemoryGameView } from "./game-view.js";
import { GameViewProjector, ShufflerService, TurnBoardCardsShuffler } from "./game-view-projector.js";
import { withOptimisticRetry } from "./optimistic-retry.js";
import { PlayerId } from "./player.entity.js";

export type LeaveGameCommand = {
  gameId: string;
  playerId: string;
};

export class LeaveGameUseCase extends Effect.Service<LeaveGameUseCase>()(
  "game/LeaveGameUseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const gameView = yield* GameView;
      const gameViewProjector = yield* GameViewProjector;

      return {
        leaveGame: (props: LeaveGameCommand) => {
          const leaveGameLogic = Effect.gen(function* () {
            const game = yield* gameRepository.findById(props.gameId);

            return yield* Option.match(game, {
              onNone: () => Effect.fail(new Error("Game not found")),
              onSome: (gameEntity) =>
                Effect.gen(function* () {
                  const updatedGame = yield* gameEntity.removePlayer(
                    PlayerId(props.playerId),
                  );

                  yield* gameRepository.save(updatedGame);
                  if (isStartedGame(updatedGame)) {
                    yield* gameView.save(
                      yield* gameViewProjector.project(
                        updatedGame.toSnapshot(),
                      ),
                    );
                  }
                }),
            });
          });

          return withOptimisticRetry(leaveGameLogic);
        },
      };
    }),
    dependencies: [
      InMemoryGameRepository,
      InMemoryGameView,
      GameViewProjector.Default,
      TurnBoardCardsShuffler.Default,
      InMemoryDeckRepository,
      ShufflerService.Default,
    ],
  },
) {}
