import { Effect, Option } from "effect";
import { CardId } from "./deck.entity.js";
import { GameRepository, InMemoryGameRepository } from "./game.repository.js";
import { GameView } from "./game-view.js";
import { GameViewProjector } from "./game-view-projector.js";
import { withOptimisticRetry } from "./optimistic-retry.js";
import { PlayerId } from "./player.entity.js";

export type SubmitClueCommand = {
  gameId: string;
  playerId: string;
  cardId: string;
  clue: string;
};

export class SubmitClueUseCase extends Effect.Service<SubmitClueUseCase>()(
  "game/SubmitClueUseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const gameView = yield* GameView;
      const gameViewProjector = yield* GameViewProjector;

      return {
        submitClue: (props: SubmitClueCommand) => {
          const submitClueLogic = Effect.gen(function* () {
            const game = yield* gameRepository.findStartedGameById(
              props.gameId,
            );

            return yield* Option.match(game, {
              onNone: () => Effect.fail(new Error("Game not found")),
              onSome: (gameEntity) =>
                Effect.gen(function* () {
                  const updatedGame = yield* gameEntity.submitClue({
                    playerId: PlayerId(props.playerId),
                    cardId: CardId(props.cardId),
                    clue: props.clue,
                  });

                  yield* gameRepository.save(updatedGame);
                  yield* gameView.save(
                    yield* gameViewProjector.project(updatedGame.toSnapshot()),
                  );
                }),
            });
          });

          return withOptimisticRetry(submitClueLogic);
        },
      };
    }),
    dependencies: [InMemoryGameRepository],
  },
) {}
