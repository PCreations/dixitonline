import { Effect, Option } from "effect";
import { CardId } from "./deck.entity.js";
import { GameId } from "./game.entity.js";
import { GameRepository, InMemoryGameRepository } from "./game.repository.js";
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
                    gameId: GameId(props.gameId),
                    cardId: CardId(props.cardId),
                    clue: props.clue,
                  });

                  yield* gameRepository.save(updatedGame);
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
