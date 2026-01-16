import { expect } from '@effect/vitest';
import { Context, Effect, Layer, Option } from 'effect';
import { Database } from '../../infra/db/database.service.js';
import { getTestDb } from '../../shared/tests/setup/test-db.js';
import { CreateGameUseCase } from '../create-game.usecase.js';
import {
  Card,
  CardId,
  DeckEntity,
  DeckId,
  IdentityDeckShuffleStrategy,
} from '../deck.entity.js';
import { DeckRepository, InMemoryDeckRepository } from '../deck.repository.js';
import {
  GameEntity,
  GameId,
  isStartedGame,
  MAX_PLAYERS,
  NoopRandomizeStrategy,
  PlayersRandomizeStrategy,
  PlayersRandomizeStrategyType,
} from '../game.entity.js';
import { GameRepository, InMemoryGameRepository } from '../game.repository.js';
import { GameEventBus, NoopGameEventBus } from '../game-event-bus.js';
import { ScoreReason } from '../game-rules.js';
import { GameView, InMemoryGameView } from '../game-view.js';
import {
  GameViewProjector,
  ShufflerService,
  TurnBoardCardsShuffler,
} from '../game-view-projector.js';
import { GameLayerWithoutDependencies } from '../index.js';
import { DrizzleGameRepository } from '../infra/drizzle/drizzle-game.repository.js';
import { JoinGameUseCase } from '../join-game.usecase.js';
import { LeaveGameUseCase } from '../leave-game.usecase.js';
import { NotifyReadyForNextTurnUseCase } from '../notify-ready-for-next-turn.usecase.js';
import { SelectCardUseCase } from '../select-card.usecase.js';
import { StartGameUseCase } from '../start-game.usecase.js';
import { SubmitClueUseCase } from '../submit-clue.usecase.js';
import { VoteOnCardUseCase } from '../vote-on-card.usecase.js';
import {
  GameDriver,
  type GameDriverDSL,
} from './game-driver.interface.js';

// Re-export types from the interface file for backward compatibility
export { GameDriver, type GameDriverDSL } from './game-driver.interface.js';

const NUMBER_OF_CARDS_IN_DECK = 100;

const makeUnitTestGameDriver = ({
  createGameUseCase,
  joinGameUseCase,
  leaveGameUseCase,
  startGameUseCase,
  submitClueUseCase,
  selectCardUseCase,
  voteOnCardUseCase,
  notifyToBeReadyForNextTurnUseCase,
  gameRepository,
  deckRepository,
  gameView,
}: {
  createGameUseCase: CreateGameUseCase;
  joinGameUseCase: JoinGameUseCase;
  leaveGameUseCase: LeaveGameUseCase;
  startGameUseCase: StartGameUseCase;
  submitClueUseCase: SubmitClueUseCase;
  selectCardUseCase: SelectCardUseCase;
  voteOnCardUseCase: VoteOnCardUseCase;
  notifyToBeReadyForNextTurnUseCase: NotifyReadyForNextTurnUseCase;
  gameRepository: Context.Tag.Service<GameRepository>;
  deckRepository: Context.Tag.Service<DeckRepository>;
  gameView: Context.Tag.Service<GameView>;
}): GameDriverDSL => {
  const testState = {
    currentError: Option.none<Error>(),
    failFast: false,
  };

  const given: GameDriverDSL['given'] = {
    defaultDeck: (props) => {
      const deck = DeckEntity.createDefault({
        id: DeckId(props.id),
        cards: (props.cards ?? [])
          .concat(
            Array.from(
              { length: NUMBER_OF_CARDS_IN_DECK - (props.cards?.length ?? 0) },
              (_, i) => `card-default-${i + 1}`,
            ),
          )
          .map((card) =>
            Card.create({
              id: CardId(card),
              url: `https://example.com/default-${card}`,
            }),
          ),
      });
      return deckRepository.save(deck);
    },
    existingDeck: (props) => {
      return Effect.gen(function* () {
        /* This will be replaced by the real create deck use case*/
        const cards = (props.cards ?? []).map((card) =>
          Card.create({ id: CardId(card), url: `https://example.com/${card}` }),
        );
        const deck = DeckEntity.create({
          id: DeckId(props.id),
          isDefault: false,
          cards,
          shuffleStrategy:
            props.shuffleStrategy === 'identity'
              ? new IdentityDeckShuffleStrategy()
              : new IdentityDeckShuffleStrategy(), // TODO: Implement shuffle strategy
        });
        yield* deckRepository.save(deck);
        return deck.toSnapshot();
      });
    },
    existingNonStartedGame: (props) => {
      return Effect.gen(function* () {
        let { deckId } = props;
        if (!deckId) {
          deckId = 'default-deck-id';
          yield* given.defaultDeck({ id: 'default-deck-id' });
        }

        yield* when.creatingGame({
          gameId: props.gameId,
          hostId: props.hostId,
          deckId,
          endCondition: props.endCondition ?? {
            type: 'NumberOfTimesBeingStoryteller',
            numberOfTimes: 3,
          },
        });

        yield* Effect.all(
          (props.players ?? [])
            .filter((player) => player !== props.hostId)
            .map((player) =>
              when.joiningGame({
                gameId: props.gameId,
                playerId: player,
              }),
            ),
        );
      });
    },
    existingFullGame: (props) => {
      return Effect.gen(function* () {
        yield* given.existingNonStartedGame({
          gameId: props.gameId,
          hostId: 'id-player-1',
          players: Array.from(
            { length: MAX_PLAYERS },
            (_, i) => `id-player-${i + 1}`,
          ),
        });
      });
    },
    existingGame: (driver, gameBuilder) => {
      return Effect.gen(function* () {
        const originalFailFast = testState.failFast;

        yield* Effect.gen(function* () {
          testState.failFast = true;
          yield* gameBuilder.build(driver);
        }).pipe(
          Effect.ensuring(
            Effect.sync(() => {
              testState.failFast = originalFailFast;
            }),
          ),
        );

        const gameId = gameBuilder.gameId;
        const deckId = gameBuilder.deckId;

        const maybeGame = yield* gameRepository.findById(gameId);
        const game = yield* Option.match(maybeGame, {
          onNone: () =>
            Effect.die(
              new Error(
                `Game ${gameId} not found during test setup. Verify the game was build correctly`,
              ),
            ),
          onSome: (game) => Effect.succeed(game),
        });

        const maybeDeck = yield* deckRepository.findById(DeckId(deckId));
        const deck = yield* Option.match(maybeDeck, {
          onNone: () =>
            Effect.die(
              new Error(
                `Deck ${deckId} not found during test setup. Verify the deck was created correctly`,
              ),
            ),
          onSome: (deck) => Effect.succeed(deck),
        });

        return {
          game: game.toSnapshot(),
          deck: deck.toSnapshot(),
        };
      });
    },
  };

  const when: GameDriverDSL['when'] = {
    creatingGame: (props) =>
      createGameUseCase.createGame({
        gameId: props.gameId,
        hostId: props.hostId,
        deckId: Option.fromNullable(props.deckId),
        endCondition: Option.fromNullable(props.endCondition).pipe(
          Option.map((endCondition) =>
            endCondition.type === 'NumberOfTimesBeingStoryteller'
              ? {
                  type: 'NumberOfTimesBeingStoryteller',
                  numberOfTimes: Option.some(endCondition.numberOfTimes),
                }
              : {
                  type: 'LimitOfPoints',
                  limit: endCondition.limit,
                },
          ),
        ),
      }),
    joiningGame: (props) => {
      return joinGameUseCase
        .joinGame({
          gameId: props.gameId,
          playerId: props.playerId,
        })
        .pipe(
          Effect.catchAll((error) => {
            if (testState.failFast) {
              return Effect.die(new Error(`[GameBuilder] ${error.message}`));
            }
            testState.currentError = Option.some(error);
            return Effect.succeed(void 0);
          }),
        );
    },
    joiningGameWhileAnotherPlayerJustJoinedInBetween: (props) => {
      return Effect.gen(function* () {
        const game = Option.getOrThrow(
          yield* gameRepository.findNotStartedGameById(props.gameId),
        );

        yield* when.joiningGame({
          gameId: props.gameId,
          playerId: props.playerThatHasJustJoinedInBetween,
        });
        yield* gameRepository.simulateStaleRead(game);

        yield* when.joiningGame({
          gameId: props.gameId,
          playerId: props.playerId,
        });
      });
    },
    leavingGame: (props) => {
      return leaveGameUseCase
        .leaveGame({
          gameId: props.gameId,
          playerId: props.playerId,
        })
        .pipe(
          Effect.catchAll((error) => {
            if (testState.failFast) {
              return Effect.die(new Error(`[GameBuilder] ${error.message}`));
            }
            testState.currentError = Option.some(error);
            return Effect.succeed(void 0);
          }),
        );
    },
    startingGame: (props) => {
      return startGameUseCase
        .startGame({
          gameId: props.gameId,
          playerId: props.playerId,
        })
        .pipe(
          Effect.catchAll((error) => {
            if (testState.failFast) {
              return Effect.die(
                new Error(`[GameBuilder] ${error.message} when starting game`),
              );
            }
            testState.currentError = Option.some(error);
            return Effect.succeed(void 0);
          }),
        );
    },
    startingGameWhileAnotherPlayerLeftInBetween: (props) => {
      return Effect.gen(function* () {
        const game = Option.getOrThrow(
          yield* gameRepository.findNotStartedGameById(props.gameId),
        );

        yield* when.leavingGame({
          gameId: props.gameId,
          playerId: props.playerThatHasLeftInBetween,
        });
        yield* gameRepository.simulateStaleRead(game);

        yield* when.startingGame({
          gameId: props.gameId,
          playerId: props.playerId,
        });
      });
    },
    submittingClue: (props) => {
      return submitClueUseCase
        .submitClue({
          gameId: props.gameId,
          playerId: props.playerId,
          cardId: props.cardId,
          clue: props.clue,
        })
        .pipe(
          Effect.catchAll((error) => {
            if (testState.failFast) {
              return Effect.die(new Error(`[GameBuilder] ${error.message}`));
            }
            testState.currentError = Option.some(error);
            return Effect.succeed(void 0);
          }),
        );
    },
    selectingCard: (props) => {
      return selectCardUseCase
        .selectCard({
          gameId: props.gameId,
          playerId: props.playerId,
          cardId: props.cardId,
        })
        .pipe(
          Effect.catchAll((error) => {
            if (testState.failFast) {
              return Effect.die(new Error(`[GameBuilder] ${error.message}`));
            }
            testState.currentError = Option.some(error);
            return Effect.succeed(void 0);
          }),
        );
    },
    votingOnCard: (props) => {
      return voteOnCardUseCase
        .voteOnCard({
          gameId: props.gameId,
          playerId: props.playerId,
          cardId: props.cardId,
        })
        .pipe(
          Effect.catchAll((error) => {
            if (testState.failFast) {
              return Effect.die(new Error(`[GameBuilder] ${error.message}`));
            }
            testState.currentError = Option.some(error);
            return Effect.succeed(void 0);
          }),
        );
    },
    notifyingToBeReadyForNextTurn: (props) => {
      return notifyToBeReadyForNextTurnUseCase
        .notifyReadyForNextTurn({
          gameId: props.gameId,
          playerId: props.playerId,
        })
        .pipe(
          Effect.catchAll((error) => {
            if (testState.failFast) {
              return Effect.die(new Error(`[GameBuilder] ${error.message}`));
            }
            testState.currentError = Option.some(error);
            return Effect.succeed(void 0);
          }),
        );
    },
  };

  const assert: GameDriverDSL['assert'] = {
    createdGameToEqual: (game) =>
      Effect.gen(function* () {
        const createdGame = yield* gameRepository.findById(game.id);

        const defaultEndCondition = {
          type: 'NumberOfTimesBeingStoryteller',
          numberOfTimes: 3,
        };

        Option.map(createdGame, (gameEntity) =>
          expect(gameEntity.toSnapshot()).toEqual({
            status: {
              _tag: 'NotStartedGame',
            },
            id: game.id,
            createdBy: game.createdBy,
            deckId: game.deckId,
            endCondition: game.endCondition ?? defaultEndCondition,
            players: game.players,
            version: 1,
          }),
        );
      }),
    playerToHaveJoinedGame: (props) =>
      Effect.gen(function* () {
        const isPlayerInGame = yield* gameRepository.isPlayerInGame(
          props.gameId,
          props.playerId,
        );
        expect(isPlayerInGame).toBe(true);
      }),
    playerToNotHaveBeenAbleToJoinGame: (props) =>
      Effect.sync(() => {
        expect(Option.map(testState.currentError, (e) => e.message)).toEqual(
          Option.some(props?.error),
        );
      }),
    playerToNotHaveBeenAbleToLeaveGame: (props) =>
      Effect.sync(() => {
        expect(Option.map(testState.currentError, (e) => e.message)).toEqual(
          Option.some(props?.error),
        );
      }),
    playerToNotHaveBeenAbleToStartGame: (props) =>
      Effect.sync(() => {
        expect(Option.map(testState.currentError, (e) => e.message)).toEqual(
          Option.some(props?.error),
        );
      }),
    gameToHavePlayers: (props) => {
      return Effect.gen(function* () {
        const game = Option.getOrThrow(
          yield* gameRepository.findById(props.gameId),
        );
        expect(game.toSnapshot().players).toEqual(props.players);
      });
    },
    gameToHaveBeenStarted: (props) => {
      return Effect.gen(function* () {
        expect(testState.currentError).toEqual(Option.none());
        const game = Option.getOrThrowWith(
          yield* gameRepository.findStartedGameById(props.gameId),
          () =>
            new Error(
              `Started Game ${props.gameId} not found while asserting game has been started`,
            ),
        );
        expect(isStartedGame(game)).toBe(true);
      });
    },
    currentTurnToBeStarted: (props) => {
      return Effect.gen(function* () {
        expect(testState.currentError).toEqual(Option.none());
        const game = Option.getOrThrowWith(
          yield* gameRepository.findStartedGameById(props.gameId),
          () =>
            new Error(
              `StartedGame ${props.gameId} not found while asserting current turn has started`,
            ),
        );
        expect(game.toSnapshot().currentTurn).toEqual(
          expect.objectContaining({
            currentStorytellerId: props.storytellerId,
            phase: 'storytelling',
            turnNumber: 1,
          }),
        );
      });
    },
    newTurnToBeStarted: (props) => {
      return Effect.gen(function* () {
        expect(testState.currentError).toEqual(Option.none());
        const game = Option.getOrThrowWith(
          yield* gameRepository.findStartedGameById(props.gameId),
          () =>
            new Error(
              `Started Game ${props.gameId} not found while asserting new turn has started`,
            ),
        );
        const expectedPlayerHands = game
          .toSnapshot()
          .currentTurn.playerHands.map((hand) => ({
            playerId: hand.playerId,
            cards: hand.cards.map((card) => card.id),
          }));
        expect(game.toSnapshot().currentTurn.currentStorytellerId).toEqual(
          props.storytellerId,
        );
        expect(game.toSnapshot().currentTurn.phase).toEqual('storytelling');
        expect(game.toSnapshot().currentTurn.turnClue).toEqual(Option.none());
        expect(game.toSnapshot().currentTurn.selectedCards).toEqual([]);
        expect(game.toSnapshot().currentTurn.votedCards).toEqual([]);
        expect(game.toSnapshot().playersHavingBeenStoryteller).toEqual(
          props.playersHavingBeenStoryteller,
        );
        expect(game.toSnapshot().currentTurn.pointsByPlayer).toEqual(
          new Map(
            props.playerHands.map((hand) => [
              hand.playerId,
              [] as ReadonlyArray<{ points: number; reason: ScoreReason }>,
            ]),
          ),
        );
        expect(game.toSnapshot().currentTurn.gameId).toEqual(props.gameId);
        expect(game.toSnapshot().currentTurn.turnNumber).toEqual(2);
        expect(expectedPlayerHands).toEqual(props.playerHands);
        expect(game.toSnapshot().currentTurn.cardsInDrawPile).toEqual(
          props.cardsInDrawPile,
        );
      });
    },
    turnClueToBeSubmitted: (props) => {
      return Effect.gen(function* () {
        expect(testState.currentError).toEqual(Option.none());
        const game = Option.getOrThrowWith(
          yield* gameRepository.findStartedGameById(props.gameId),
          () =>
            new Error(
              `StartedGame ${props.gameId} not found while asserting turn clue has been submitted`,
            ),
        );
        expect(game.toSnapshot().currentTurn.turnClue).toEqual(
          Option.some({
            clue: props.storytellerClue,
            cardId: props.storytellerCardId,
          }),
        );
        expect(game.toSnapshot().currentTurn.phase).toEqual('selecting-cards');
      });
    },
    turnToHaveSelectedCards: (props) => {
      return Effect.gen(function* () {
        expect(testState.currentError).toEqual(Option.none());
        const game = Option.getOrThrowWith(
          yield* gameRepository.findStartedGameById(props.gameId),
          () =>
            new Error(
              `Started Game ${props.gameId} not found while asserting turn has selected cards`,
            ),
        );
        expect(game.toSnapshot().currentTurn.selectedCards).toEqual(
          props.selectedCards,
        );
      });
    },
    turnToBeInVotingPhase: (props) => {
      return Effect.gen(function* () {
        expect(testState.currentError).toEqual(Option.none());
        const game = Option.getOrThrowWith(
          yield* gameRepository.findStartedGameById(props.gameId),
          () =>
            new Error(
              `Started Game ${props.gameId} not found while asserting turn is in voting phase`,
            ),
        );
        expect(game.toSnapshot().currentTurn.phase).toEqual('voting');
      });
    },
    turnToBeInScoringPhase: (props) => {
      return Effect.gen(function* () {
        expect(testState.currentError).toEqual(Option.none());
        const game = Option.getOrThrowWith(
          yield* gameRepository.findStartedGameById(props.gameId),
          () =>
            new Error(
              `Started Game ${props.gameId} not found while asserting turn is in scoring phase`,
            ),
        );
        expect(game.toSnapshot().currentTurn.phase).toEqual('scoring');
      });
    },
    playersToHaveScore: (props) => {
      return Effect.gen(function* () {
        const game = Option.getOrThrowWith(
          yield* gameRepository.findStartedGameById(props.gameId),
          () =>
            new Error(
              `Started Game ${props.gameId} not found while asserting players have score`,
            ),
        );
        expect(game.toSnapshot().scores).toEqual(props.scores);
      });
    },
    playerHandsToEqual: (props) => {
      return Effect.gen(function* () {
        const game = Option.getOrThrowWith(
          yield* gameRepository.findStartedGameById(props.gameId),
          () =>
            new Error(
              `Started Game ${props.gameId} not found while asserting player hands are equal`,
            ),
        );
        const expectedPlayerHands = game
          .toSnapshot()
          .currentTurn.playerHands.map((hand) => ({
            playerId: hand.playerId,
            cards: hand.cards.map((card) => card.id),
          }));
        expect(testState.currentError).toEqual(Option.none());
        expect(expectedPlayerHands).toEqual(props.playerHands);
      });
    },
    playerToNotHaveBeenAbleToSubmitClue: (props) =>
      Effect.sync(() => {
        expect(Option.map(testState.currentError, (e) => e.message)).toEqual(
          Option.some(props?.error),
        );
      }),
    playerToNotHaveBeenAbleToSelectCard: (props) =>
      Effect.sync(() => {
        expect(Option.map(testState.currentError, (e) => e.message)).toEqual(
          Option.some(props?.error),
        );
      }),
    playerToHaveVotedOnCard: (props) =>
      Effect.gen(function* () {
        expect(testState.currentError).toEqual(Option.none());
        const game = Option.getOrThrowWith(
          yield* gameRepository.findStartedGameById(props.gameId),
          () =>
            new Error(
              `Started Game ${props.gameId} not found while asserting player has voted on card`,
            ),
        );
        expect(game.toSnapshot().currentTurn.votedCards).toEqual(
          expect.arrayContaining([
            {
              cardId: props.cardId,
              ownedBy: props.ownedBy,
              votedBy: props.votedBy,
            },
          ]),
        );
      }),
    playerToNotHaveBeenAbleToVoteOnCard: (props) =>
      Effect.sync(() => {
        expect(Option.map(testState.currentError, (e) => e.message)).toEqual(
          Option.some(props?.error),
        );
      }),
    playersReadyForNextTurnToEqual: (props) => {
      return Effect.gen(function* () {
        const game = Option.getOrThrowWith(
          yield* gameRepository.findStartedGameById(props.gameId),
          () =>
            new Error(
              `Started Game ${props.gameId} not found while asserting players ready for next turn are equal`,
            ),
        );
        expect(game.toSnapshot().playersReadyForNextTurn).toEqual(
          props.playersReadyForNextTurn,
        );
      });
    },
    playerToNotHaveBeenAbleToNotifyToBeReadyForNextTurn: (props) =>
      Effect.sync(() => {
        expect(Option.map(testState.currentError, (e) => e.message)).toEqual(
          Option.some(props?.error),
        );
      }),
    gameViewToEqual: (props) => {
      return Effect.gen(function* () {
        const gameViewValueObject = yield* gameView.get(GameId(props.gameId));
        expect(gameViewValueObject).toEqual(props.gameView);
      });
    },
    gameToBeEnded: (props) => {
      return Effect.gen(function* () {
        const game = Option.getOrThrowWith(
          yield* gameRepository.findById(props.gameId),
          () =>
            new Error(
              `Game ${props.gameId} not found while asserting game is ended`,
            ),
        );
        expect(game.toSnapshot().status._tag).toEqual('EndedGame');
      });
    },
  };

  const getGameSnapshot = (gameId: string) =>
    Effect.gen(function* () {
      const game = Option.getOrThrowWith(
        yield* gameRepository.findById(gameId),
        () =>
          new Error(
            `Started Game ${gameId} not found while getting game snapshot`,
          ),
      );
      return game.toSnapshot();
    });

  const getStartedGameSnapshot = (gameId: string) =>
    Effect.gen(function* () {
      const game = Option.getOrThrowWith(
        yield* gameRepository.findStartedGameById(gameId),
        () =>
          new Error(
            `Started Game ${gameId} not found while getting started game snapshot`,
          ),
      );
      return game.toSnapshot();
    });

  const gameEndedGameSnapshot = (gameId: string) =>
    Effect.gen(function* () {
      const game = Option.getOrThrowWith(
        yield* gameRepository.findEndedGameById(gameId),
        () =>
          new Error(
            `Ended Game ${gameId} not found while getting ended game snapshot`,
          ),
      );
      return game.toSnapshot();
    });

  const unsafe__saveGameEntity = (game: GameEntity) =>
    Effect.gen(function* () {
      yield* gameRepository.save(game).pipe(
        Effect.catchAll((error) => {
          if (testState.failFast) {
            console.error(error);
            return Effect.die(
              new Error(
                `[GameDriver] while calling unsafe__saveGameEntity ${error.message}`,
              ),
            );
          }
          testState.currentError = Option.some(error);
          return Effect.succeed(void 0);
        }),
      );
    });

  const withFailFastMode = (): GameDriverDSL => {
    testState.failFast = true;
    return {
      given,
      when,
      assert,
      withFailFastMode,
      getGameSnapshot,
      getStartedGameSnapshot,
      gameEndedGameSnapshot,
      unsafe__saveGameEntity,
    };
  };

  return {
    given,
    when,
    assert,
    withFailFastMode,
    getGameSnapshot,
    getStartedGameSnapshot,
    gameEndedGameSnapshot,
    unsafe__saveGameEntity,
  };
};

export const makeGameDriverTestLayer = (props?: {
  randomizeStrategy?: PlayersRandomizeStrategyType;
  dependencies?: Layer.Layer<
    | GameRepository
    | DeckRepository
    | GameView
    | TurnBoardCardsShuffler
    | GameViewProjector
    | ShufflerService
    | PlayersRandomizeStrategy
    | GameEventBus
  >;
}) => {
  const dependencies =
    props?.dependencies ??
    Layer.mergeAll(
      InMemoryGameRepository,
      InMemoryDeckRepository,
      InMemoryGameView,
      TurnBoardCardsShuffler.Default,
      GameViewProjector.Default,
      ShufflerService.Default,
      NoopGameEventBus,
      props?.randomizeStrategy
        ? Layer.succeed(PlayersRandomizeStrategy, props.randomizeStrategy)
        : NoopRandomizeStrategy,
    );

  return Layer.merge(
    Layer.effect(
      GameDriver,
      Effect.gen(function* () {
        const createGameUseCase = yield* CreateGameUseCase;
        const joinGameUseCase = yield* JoinGameUseCase;
        const leaveGameUseCase = yield* LeaveGameUseCase;
        const startGameUseCase = yield* StartGameUseCase;
        const submitClueUseCase = yield* SubmitClueUseCase;
        const selectCardUseCase = yield* SelectCardUseCase;
        const voteOnCardUseCase = yield* VoteOnCardUseCase;
        const notifyToBeReadyForNextTurnUseCase =
          yield* NotifyReadyForNextTurnUseCase;
        const gameRepository = yield* GameRepository;
        const deckRepository = yield* DeckRepository;
        const gameView = yield* GameView;

        return makeUnitTestGameDriver({
          createGameUseCase,
          joinGameUseCase,
          leaveGameUseCase,
          startGameUseCase,
          submitClueUseCase,
          selectCardUseCase,
          voteOnCardUseCase,
          notifyToBeReadyForNextTurnUseCase,
          gameRepository,
          deckRepository,
          gameView,
        });
      }),
    ).pipe(
      Layer.provide(GameLayerWithoutDependencies),
      Layer.provide(dependencies),
    ),
    // Also expose GameViewProjector and TurnBoardCardsShuffler directly for tests
    Layer.merge(GameViewProjector.Default, TurnBoardCardsShuffler.Default),
  ).pipe(Layer.provide(dependencies));
};

export const makeGameDriverAcceptanceLayer = () => {
  return makeGameDriverTestLayer({
    dependencies: Layer.mergeAll(
      InMemoryGameRepository,
      InMemoryDeckRepository,
      InMemoryGameView,
      TurnBoardCardsShuffler.Default,
      GameViewProjector.Default,
      ShufflerService.Default,
      NoopGameEventBus,
      NoopRandomizeStrategy,
    ),
  });
};

/**
 * Creates a GameDriver layer that uses real Drizzle repositories with PostgreSQL.
 *
 * This layer is intended for integration tests that require a real database.
 * It uses:
 * - DrizzleGameRepository (real PostgreSQL via Testcontainers)
 * - InMemoryDeckRepository (in-memory, no table needed)
 * - InMemoryGameView (in-memory projection)
 *
 * Prerequisites:
 * - The test must be run with the integration test setup (vitest.config.int.ts)
 * - The database must be initialized via acceptance-test.setup.ts
 * - Use getTestDb() to get the initialized Drizzle instance
 */
export const makeGameDriverDrizzleLayer = (props?: {
  randomizeStrategy?: PlayersRandomizeStrategyType;
}) => {
  // Get the test database instance (initialized by acceptance test setup)
  const db = getTestDb();

  // Create a Database layer from the test database
  const databaseLayer = Layer.succeed(Database, { db });

  // Mix: GameRepository uses Drizzle, rest stays in-memory
  const drizzleDependencies = Layer.mergeAll(
    DrizzleGameRepository.pipe(Layer.provide(databaseLayer)),
    InMemoryDeckRepository,
    InMemoryGameView,
    TurnBoardCardsShuffler.Default,
    GameViewProjector.Default,
    ShufflerService.Default,
    NoopGameEventBus,
    props?.randomizeStrategy
      ? Layer.succeed(PlayersRandomizeStrategy, props.randomizeStrategy)
      : NoopRandomizeStrategy,
  );

  return makeGameDriverTestLayer({
    ...(props?.randomizeStrategy && {
      randomizeStrategy: props.randomizeStrategy,
    }),
    dependencies: drizzleDependencies,
  });
};

export type GameDriverLayer = ReturnType<typeof makeGameDriverTestLayer>;
