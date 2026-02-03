import { Effect, Option } from 'effect';
import { Clock, ClockLive } from './clock.service.js';
import { CardId } from './deck.entity.js';
import { InMemoryDeckRepository } from './deck.repository.js';
import {
  GameEntity,
  isStartedGame,
  NoopRandomizeStrategy,
  StartedGameEntity,
} from './game.entity.js';
import type { GameEvent } from './game-events.js';
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

export type ProcessExpiredTimersCommand = {
  gameId: string;
};

export class ProcessExpiredTimersUseCase extends Effect.Service<ProcessExpiredTimersUseCase>()(
  'game/ProcessExpiredTimersUseCase',
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const gameView = yield* GameView;
      const gameViewProjector = yield* GameViewProjector;
      const clock = yield* Clock;

      return {
        processExpiredTimers: (props: ProcessExpiredTimersCommand) => {
          const processSinglePlayer = (playerId: PlayerId) =>
            Effect.gen(function* () {
              const game =
                yield* gameRepository.findStartedGameById(props.gameId);
              const gameEntity = yield* Option.match(game, {
                onNone: () => Effect.fail(new Error('Started game not found')),
                onSome: Effect.succeed,
              });

              const now = yield* clock.now();
              const expiredPlayers =
                gameEntity.props.currentTurn.getExpiredPlayerDeadlines(now);

              // Player may have acted since we started - skip if no longer expired
              if (!expiredPlayers.includes(playerId)) {
                return;
              }

              const result = yield* processAutoPlayForPlayer(
                gameEntity,
                playerId,
                now,
              );

              // Handle game end vs game continue differently
              if (isStartedGame(result.game)) {
                yield* gameRepository.saveWithEvents(result.game, result.events);
                yield* gameView.save(
                  yield* gameViewProjector.project(result.game.toSnapshot()),
                );
              } else {
                // Game ended - save the ended game entity
                yield* gameRepository.save(result.game);
              }
            });

          const processAllExpired = Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan(
              'context.input',
              JSON.stringify(props),
            );

            const game =
              yield* gameRepository.findStartedGameById(props.gameId);
            const gameEntity = yield* Option.match(game, {
              onNone: () => Effect.fail(new Error('Started game not found')),
              onSome: Effect.succeed,
            });

            const now = yield* clock.now();
            const expiredPlayers =
              gameEntity.props.currentTurn.getExpiredPlayerDeadlines(now);

            if (expiredPlayers.length === 0) {
              yield* Effect.annotateCurrentSpan(
                'context.output',
                JSON.stringify({ noExpiredDeadlines: true }),
              );
              return;
            }

            // Process each expired player individually with optimistic retry
            for (const playerId of expiredPlayers) {
              yield* withOptimisticRetry(processSinglePlayer(playerId));
            }

            yield* Effect.annotateCurrentSpan(
              'context.output',
              JSON.stringify({ processedPlayers: expiredPlayers }),
            );
          });

          return processAllExpired.pipe(
            Effect.withSpan('ProcessExpiredTimersUseCase.processExpiredTimers'),
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

type AutoPlayResult = {
  readonly game: GameEntity;
  readonly events: ReadonlyArray<GameEvent>;
};

const processAutoPlayForPlayer = (
  game: StartedGameEntity,
  playerId: PlayerId,
  now: Date,
): Effect.Effect<AutoPlayResult, Error> => {
  const phase = game.toSnapshot().currentTurn.phase;

  switch (phase) {
    case 'storytelling':
      return autoPlayStorytelling(game, playerId, now);
    case 'selecting-cards':
      return autoPlaySelectingCards(game, playerId, now);
    case 'voting':
      return autoPlayVoting(game, playerId, now);
    case 'scoring':
      return autoPlayScoring(game, playerId, now);
    default:
      return Effect.succeed({ game, events: [] });
  }
};

const autoPlayStorytelling = (
  game: StartedGameEntity,
  playerId: PlayerId,
  now: Date,
): Effect.Effect<AutoPlayResult, Error> => {
  return Effect.gen(function* () {
    const storytellerHand = game.props.currentTurn.playerHands.find(
      (h) => h.playerId === playerId,
    );

    if (!storytellerHand || storytellerHand.cards.length === 0) {
      return { game, events: [] };
    }

    const cardToPlay = storytellerHand.cards[0];
    const autoClue = '...';

    const { entity, events } = yield* game.submitClue({
      playerId,
      cardId: cardToPlay.id,
      clue: autoClue,
      deadlineConfig: {
        now,
        timeoutMs: TURN_TIMER_CONFIG.playerActionTimeoutMs,
      },
    });

    return { game: entity, events };
  });
};

const autoPlaySelectingCards = (
  game: StartedGameEntity,
  playerId: PlayerId,
  now: Date,
): Effect.Effect<AutoPlayResult, Error> => {
  return Effect.gen(function* () {
    const playerHand = game.props.currentTurn.playerHands.find(
      (h) => h.playerId === playerId,
    );

    if (!playerHand || playerHand.cards.length === 0) {
      return { game, events: [] };
    }

    const cardToSelect = playerHand.cards[0];

    const { entity, events } = yield* game.selectCard({
      playerId,
      cardId: cardToSelect.id,
      deadlineConfig: {
        now,
        timeoutMs: TURN_TIMER_CONFIG.playerActionTimeoutMs,
      },
    });

    return { game: entity, events };
  });
};

const autoPlayVoting = (
  game: StartedGameEntity,
  playerId: PlayerId,
  now: Date,
): Effect.Effect<AutoPlayResult, Error> => {
  return Effect.gen(function* () {
    const snapshot = game.toSnapshot();
    const storytellerCard = snapshot.currentTurn.turnClue;

    if (storytellerCard._tag !== 'Some') {
      return { game, events: [] };
    }

    const votableCards = getVotableCardsForPlayer(
      snapshot.currentTurn.selectedCards,
      storytellerCard.value.cardId,
      snapshot.currentTurn.currentStorytellerId,
      playerId,
    );

    if (votableCards.length === 0) {
      return { game, events: [] };
    }

    const cardToVoteOn = votableCards[0];

    const { entity, events } = yield* game.voteOnCard({
      playerId,
      cardId: CardId(cardToVoteOn.cardId),
      deadlineConfig: {
        now,
        timeoutMs: TURN_TIMER_CONFIG.playerActionTimeoutMs,
      },
    });

    return { game: entity, events };
  });
};

const getVotableCardsForPlayer = (
  selectedCards: ReadonlyArray<{ cardId: string; playerId: string }>,
  storytellerCardId: string,
  storytellerId: string,
  votingPlayerId: PlayerId,
): ReadonlyArray<{ cardId: string; playerId: string }> => {
  const allCards = [
    ...selectedCards,
    { cardId: storytellerCardId, playerId: storytellerId },
  ];
  return allCards.filter((card) => card.playerId !== votingPlayerId);
};

const autoPlayScoring = (
  game: StartedGameEntity,
  playerId: PlayerId,
  now: Date,
): Effect.Effect<AutoPlayResult, Error> => {
  return Effect.gen(function* () {
    const result = yield* game.notifyReadyForNextTurn({
      playerId,
      deadlineConfig: {
        now,
        timeoutMs: TURN_TIMER_CONFIG.playerActionTimeoutMs,
      },
    });

    return { game: result.entity, events: result.events };
  });
};
