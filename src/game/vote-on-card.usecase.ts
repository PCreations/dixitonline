import { Effect, Option } from 'effect';
import { CardId } from './deck.entity.js';
import { InMemoryDeckRepository } from './deck.repository.js';
import { GameRepository, InMemoryGameRepository } from './game.repository.js';
import { GameView, InMemoryGameView } from './game-view.js';
import {
  GameViewProjector,
  ShufflerService,
  TurnBoardCardsShuffler,
} from './game-view-projector.js';
import { withOptimisticRetry } from './optimistic-retry.js';
import { PlayerId } from './player.entity.js';

export type VoteOnCardCommand = {
  gameId: string;
  playerId: string;
  cardId: string;
};

export class VoteOnCardUseCase extends Effect.Service<VoteOnCardUseCase>()(
  'game/VoteUseCase',
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const gameView = yield* GameView;
      const gameViewProjector = yield* GameViewProjector;

      return {
        voteOnCard: (props: VoteOnCardCommand) => {
          const voteOnCardLogic = Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan(
              'context.input',
              JSON.stringify(props),
            );

            const game = yield* gameRepository.findStartedGameById(
              props.gameId,
            );

            return yield* Option.match(game, {
              onNone: () => {
                Effect.runSync(
                  Effect.annotateCurrentSpan(
                    'context.output',
                    JSON.stringify({ error: 'Game not found' }),
                  ),
                );
                return Effect.fail(new Error('Game not found'));
              },
              onSome: (gameEntity) =>
                Effect.gen(function* () {
                  const { entity: updatedGame, events } =
                    yield* gameEntity.voteOnCard({
                      playerId: PlayerId(props.playerId),
                      cardId: CardId(props.cardId),
                    });

                  // Save game and events atomically (outbox pattern)
                  yield* gameRepository.saveWithEvents(updatedGame, events);
                  yield* gameView.save(
                    yield* gameViewProjector.project(updatedGame.toSnapshot()),
                  );

                  yield* Effect.annotateCurrentSpan(
                    'context.output',
                    JSON.stringify({
                      snapshot: updatedGame.toSnapshot(),
                      events,
                    }),
                  );
                }),
            });
          });

          return withOptimisticRetry(voteOnCardLogic).pipe(
            Effect.withSpan('VoteOnCardUseCase.voteOnCard'),
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
