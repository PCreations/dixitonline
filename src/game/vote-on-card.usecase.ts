import { Effect, Option } from "effect";
import { CardId } from "./deck.entity.js";
import { GameRepository, InMemoryGameRepository } from "./game.repository.js";
import { GameView } from "./game-view.js";
import { GameViewProjector } from "./game-view-projector.js";
import { withOptimisticRetry } from "./optimistic-retry.js";
import { PlayerId } from "./player.entity.js";

export type VoteOnCardCommand = {
  gameId: string;
  playerId: string;
  cardId: string;
};

export class VoteOnCardUseCase extends Effect.Service<VoteOnCardUseCase>()(
  "game/VoteUseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const gameView = yield* GameView;
      const gameViewProjector = yield* GameViewProjector;

      return {
        voteOnCard: (props: VoteOnCardCommand) => {
          const voteOnCardLogic = Effect.gen(function* () {
            const game = yield* gameRepository.findStartedGameById(
              props.gameId,
            );

            return yield* Option.match(game, {
              onNone: () => Effect.fail(new Error("Game not found")),
              onSome: (gameEntity) =>
                Effect.gen(function* () {
                  const updatedGame = yield* gameEntity.voteOnCard({
                    playerId: PlayerId(props.playerId),
                    cardId: CardId(props.cardId),
                  });

                  yield* gameRepository.save(updatedGame);
                  yield* gameView.save(
                    yield* gameViewProjector.project(updatedGame.toSnapshot()),
                  );
                }),
            });
          });

          return withOptimisticRetry(voteOnCardLogic);
        },
      };
    }),
    dependencies: [InMemoryGameRepository],
  },
) {}
