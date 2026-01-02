import { Effect, Option } from "effect";
import { InMemoryDeckRepository } from "./deck.repository.js";
import { isStartedGame } from "./game.entity.js";
import { GameRepository, InMemoryGameRepository } from "./game.repository.js";
import { GameView, InMemoryGameView } from "./game-view.js";
import { GameViewProjector, ShufflerService, TurnBoardCardsShuffler } from "./game-view-projector.js";
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
        const gameView = yield* GameView;
        const gameViewProjector = yield* GameViewProjector;

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
                    const { entity: updatedGame, events } =
                      yield* gameEntity.notifyReadyForNextTurn({
                        playerId: PlayerId(props.playerId),
                      });

                    // Save game and events atomically (outbox pattern)
                    yield* gameRepository.saveWithEvents(updatedGame, events);

                    // Only update game view if the game is still in progress
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

            return withOptimisticRetry(notifyReadyForNextTurnLogic);
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
