import { Effect, Option } from 'effect';
import { InMemoryDeckRepository } from './deck.repository.js';
import { isStartedGame } from './game.entity.js';
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

export type NotifyReadyForNextTurnCommand = {
  gameId: string;
  playerId: string;
};

export class NotifyReadyForNextTurnUseCase extends Effect.Service<NotifyReadyForNextTurnUseCase>()(
  'game/NotifyReadyForNextTurnUseCase',
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const gameView = yield* GameView;
      const gameViewProjector = yield* GameViewProjector;
      const clock = yield* Clock;

      return {
        notifyReadyForNextTurn: (props: NotifyReadyForNextTurnCommand) => {
          const notifyReadyForNextTurnLogic = Effect.gen(function* () {
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
                    yield* gameEntity.notifyReadyForNextTurn({
                      playerId: PlayerId(props.playerId),
                      deadlineConfig: {
                        now,
                        timeoutMs: TURN_TIMER_CONFIG.playerActionTimeoutMs,
                      },
                    });

                  // Skip saving if nothing changed (idempotent case)
                  if (updatedGame === gameEntity) {
                    return;
                  }

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

          return withOptimisticRetry(notifyReadyForNextTurnLogic).pipe(
            Effect.withSpan(
              'NotifyReadyForNextTurnUseCase.notifyReadyForNextTurn',
            ),
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
