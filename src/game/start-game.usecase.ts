import { Effect, Option } from 'effect';
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

            const { entity: updatedGame, events } = yield* gameEntity.start({
              playerId: PlayerId(props.playerId),
              deck: deckEntity,
              startedAt: new Date(),
              randomizeStrategy: randomizeStrategy,
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
    ],
  },
) {}
