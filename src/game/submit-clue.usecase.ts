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
import { Clock, ClockLive } from './clock.service.js';
import { TURN_TIMER_CONFIG } from './turn-timer.config.js';

export type SubmitClueCommand = {
  gameId: string;
  playerId: string;
  cardId: string;
  clue: string;
};

export class SubmitClueUseCase extends Effect.Service<SubmitClueUseCase>()(
  'game/SubmitClueUseCase',
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const gameView = yield* GameView;
      const gameViewProjector = yield* GameViewProjector;
      const clock = yield* Clock;

      return {
        submitClue: (props: SubmitClueCommand) => {
          const submitClueLogic = Effect.gen(function* () {
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
                  const now = yield* clock.now();
                  const { entity: updatedGame, events } =
                    yield* gameEntity.submitClue({
                      playerId: PlayerId(props.playerId),
                      cardId: CardId(props.cardId),
                      clue: props.clue,
                      deadlineConfig: {
                        now,
                        timeoutMs: TURN_TIMER_CONFIG.playerActionTimeoutMs,
                      },
                      wasAutoPlayed: false,
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

          return withOptimisticRetry(submitClueLogic).pipe(
            Effect.withSpan('SubmitClueUseCase.submitClue'),
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
      ClockLive,
    ],
  },
) {}
