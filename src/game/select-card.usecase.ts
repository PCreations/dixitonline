import { Effect, Option } from "effect";
import { CardId } from "./deck.entity.js";
import { InMemoryDeckRepository } from "./deck.repository.js";
import { GameRepository, InMemoryGameRepository } from "./game.repository.js";
import { GameView, InMemoryGameView } from "./game-view.js";
import { GameViewProjector, ShufflerService, TurnBoardCardsShuffler } from "./game-view-projector.js";
import { withOptimisticRetry } from "./optimistic-retry.js";
import { PlayerId } from "./player.entity.js";

export type SelectCardCommand = {
  gameId: string;
  playerId: string;
  cardId: string;
};

export class SelectCardUseCase extends Effect.Service<SelectCardUseCase>()(
  "game/SelectCardUseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const gameView = yield* GameView;
      const gameViewProjector = yield* GameViewProjector;

      return {
        selectCard: (props: SelectCardCommand) => {
          const selectCardLogic = Effect.gen(function* () {
            const game = yield* gameRepository.findStartedGameById(
              props.gameId,
            );

            return yield* Option.match(game, {
              onNone: () => Effect.fail(new Error("Game not found")),
              onSome: (gameEntity) =>
                Effect.gen(function* () {
                  const { entity: updatedGame, events } =
                    yield* gameEntity.selectCard({
                      playerId: PlayerId(props.playerId),
                      cardId: CardId(props.cardId),
                    });

                  // Save game and events atomically (outbox pattern)
                  yield* gameRepository.saveWithEvents(updatedGame, events);
                  yield* gameView.save(
                    yield* gameViewProjector.project(updatedGame.toSnapshot()),
                  );
                }),
            });
          });

          return withOptimisticRetry(selectCardLogic).pipe(
            Effect.withSpan('SelectCardUseCase.selectCard', {
              attributes: {
                'game.id': props.gameId,
                'player.id': props.playerId,
              },
            }),
          );
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
