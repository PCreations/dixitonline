import { Effect, Option } from 'effect';
import { Clock, ClockLive } from './clock.service.js';
import { DeckRepository, InMemoryDeckRepository } from './deck.repository.js';
import {
  NoopRandomizeStrategy,
  PlayersRandomizeStrategy,
} from './game.entity.js';
import { GameRepository, InMemoryGameRepository } from './game.repository.js';
import { GameView, InMemoryGameView } from './game-view.js';
import {
  GameViewProjector,
  ShufflerService,
  TurnBoardCardsShuffler,
} from './game-view-projector.js';
import { withOptimisticRetry } from './optimistic-retry.js';
import { PlayerId } from './player.entity.js';
import { TURN_TIMER_CONFIG } from './turn-timer.config.js';

export type StartGameCommand = {
  gameId: string;
  playerId: string;
};

export class StartGameUseCase extends Effect.Service<StartGameUseCase>()(
  'game/StartGameUseCase',
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const deckRepository = yield* DeckRepository;
      const gameView = yield* GameView;
      const randomizeStrategy = yield* PlayersRandomizeStrategy;
      const gameViewProjector = yield* GameViewProjector;
      const clock = yield* Clock;

      return {
        startGame: (props: StartGameCommand) => {
          const startGameLogic = Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan(
              'context.input',
              JSON.stringify(props),
            );

            const game = yield* gameRepository.findNotStartedGameById(
              props.gameId,
            );
            const gameEntity = yield* Option.match(game, {
              onNone: () => {
                Effect.runSync(
                  Effect.annotateCurrentSpan(
                    'context.output',
                    JSON.stringify({ error: 'Game not found' }),
                  ),
                );
                return Effect.fail(new Error('Game not found'));
              },
              onSome: Effect.succeed,
            });

            const deck = yield* deckRepository.findById(gameEntity.deckId);
            const deckEntity = yield* Option.match(deck, {
              onNone: () => {
                Effect.runSync(
                  Effect.annotateCurrentSpan(
                    'context.output',
                    JSON.stringify({ error: 'Deck not found' }),
                  ),
                );
                return Effect.fail(new Error('Deck not found'));
              },
              onSome: Effect.succeed,
            });

            const now = yield* clock.now();

            const { entity: startedGame, events } = yield* gameEntity.start({
              playerId: PlayerId(props.playerId),
              deck: deckEntity,
              startedAt: now,
              randomizeStrategy: randomizeStrategy,
            });

            const storytellerDeadline = new Date(
              now.getTime() + TURN_TIMER_CONFIG.playerActionTimeoutMs,
            );
            const gameWithDeadline = startedGame.setPlayerDeadline(
              startedGame.props.currentTurn.currentStorytellerId,
              storytellerDeadline,
            );

            // Save game and events atomically (outbox pattern)
            yield* gameRepository.saveWithEvents(gameWithDeadline, events);

            yield* gameView.save(
              yield* gameViewProjector.project(gameWithDeadline.toSnapshot()),
            );

            yield* Effect.annotateCurrentSpan(
              'context.output',
              JSON.stringify({
                snapshot: gameWithDeadline.toSnapshot(),
                events,
              }),
            );
          });

          return withOptimisticRetry(startGameLogic).pipe(
            Effect.withSpan('StartGameUseCase.startGame'),
          );
        },
      };
    }),
    dependencies: [
      InMemoryGameRepository,
      InMemoryDeckRepository,
      InMemoryGameView,
      NoopRandomizeStrategy,
      TurnBoardCardsShuffler.Default,
      GameViewProjector.Default,
      ShufflerService.Default,
      ClockLive,
    ],
  },
) {}
