import { expect } from "@effect/vitest";
import { Context, Effect, Layer, Option } from "effect";
import { CreateGameUseCase } from "../create-game.usecase.js";
import {
  Card,
  CardId,
  DeckEntity,
  DeckId,
  IdentityDeckShuffleStrategy,
} from "../deck.entity.js";
import { DeckRepository, InMemoryDeckRepository } from "../deck.repository.js";
import {
  GameEntitySnapshot,
  isStartedGame,
  MAX_PLAYERS,
  NoopRandomizeStrategy,
  PlayersRandomizeStrategy,
  PlayersRandomizeStrategyType,
} from "../game.entity.js";
import { GameRepository, InMemoryGameRepository } from "../game.repository.js";
import { GameLayerWithoutDependencies } from "../index.js";
import { JoinGameUseCase } from "../join-game.usecase.js";
import { LeaveGameUseCase } from "../leave-game.usecase.js";
import { SelectCardUseCase } from "../select-card.usecase.js";
import { StartGameUseCase } from "../start-game.usecase.js";
import { SubmitClueUseCase } from "../submit-clue.usecase.js";
import { VoteOnCardUseCase } from "../vote-on-card.usecase.js";
import type { GameBuilder } from "./game.builder.js";

type EndConditionDto =
  | {
    type: "NumberOfTimesBeingStoryteller";
    numberOfTimes: number;
  }
  | {
    type: "LimitOfPoints";
    limit: number;
  };

interface GameDriverDSL {
  readonly getGameSnapshot: (
    gameId: string,
  ) => Effect.Effect<GameEntitySnapshot>;
  readonly given: {
    readonly defaultDeck: (props: {
      id: string;
      cards?: ReadonlyArray<string>;
      withShuffledCards?: ReadonlyArray<string>;
    }) => Effect.Effect<void>;
    readonly existingDeck: (props: {
      id: string;
      cards?: ReadonlyArray<string>;
      shuffleStrategy?: "identity" | "shuffle";
    }) => Effect.Effect<void>;
    readonly existingNonStartedGame: (props: {
      gameId: string;
      hostId: string;
      deckId?: string;
      players?: ReadonlyArray<string>;
    }) => Effect.Effect<void>;
    readonly existingFullGame: (props: {
      gameId: string;
    }) => Effect.Effect<void>;
    readonly existingGame: (
      driver: GameDriverDSL,
      builder: GameBuilder,
    ) => Effect.Effect<{
      game: GameEntitySnapshot;
      deck: { id: string; cards: ReadonlyArray<string> };
    }>;
  };
  readonly withFailFastMode: () => GameDriverDSL;
  readonly when: {
    readonly creatingGame: (props: {
      gameId: string;
      hostId: string;
      deckId?: string;
      endCondition?: EndConditionDto;
    }) => Effect.Effect<void>;
    readonly joiningGame: (props: {
      gameId: string;
      playerId: string;
    }) => Effect.Effect<void>;
    readonly joiningGameWhileAnotherPlayerJustJoinedInBetween: (props: {
      gameId: string;
      playerId: string;
      playerThatHasJustJoinedInBetween: string;
    }) => Effect.Effect<void>;
    readonly leavingGame: (props: {
      gameId: string;
      playerId: string;
    }) => Effect.Effect<void>;
    readonly startingGame: (props: {
      gameId: string;
      playerId: string;
      randomizeStrategy?: PlayersRandomizeStrategy;
    }) => Effect.Effect<void>;
    readonly startingGameWhileAnotherPlayerLeftInBetween: (props: {
      gameId: string;
      playerId: string;
      playerThatHasLeftInBetween: string;
    }) => Effect.Effect<void>;
    readonly submittingClue: (props: {
      gameId: string;
      playerId: string;
      cardId: string;
      clue: string;
    }) => Effect.Effect<void>;
    readonly selectingCard: (props: {
      gameId: string;
      playerId: string;
      cardId: string;
    }) => Effect.Effect<void>;
    readonly votingOnCard: (props: {
      gameId: string;
      playerId: string;
      cardId: string;
    }) => Effect.Effect<void>;
  };
  readonly assert: {
    readonly createdGameToEqual: (game: {
      id: string;
      createdBy: string;
      deckId: string;
      endCondition?: EndConditionDto;
      players: ReadonlyArray<string>;
    }) => Effect.Effect<void, never, never>;
    readonly playerToHaveJoinedGame: (props: {
      gameId: string;
      playerId: string;
    }) => Effect.Effect<void, never, never>;
    readonly playerToNotHaveBeenAbleToJoinGame: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly playerToNotHaveBeenAbleToLeaveGame: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly playerToNotHaveBeenAbleToStartGame: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly gameToHavePlayers: (props: {
      gameId: string;
      players: ReadonlyArray<string>;
    }) => Effect.Effect<void, never, never>;
    readonly gameToHaveBeenStarted: (props: {
      gameId: string;
    }) => Effect.Effect<void, never, never>;
    readonly currentTurnToBeStarted: (props: {
      gameId: string;
      storytellerId: string;
    }) => Effect.Effect<void, never, never>;
    readonly playerHandsToEqual: (props: {
      gameId: string;
      playerHands: ReadonlyArray<{
        playerId: string;
        cards: ReadonlyArray<string>;
      }>;
    }) => Effect.Effect<void, never, never>;
    readonly turnClueToBeSubmitted: (props: {
      gameId: string;
      storytellerClue: string;
      storytellerCardId: string;
    }) => Effect.Effect<void, never, never>;
    readonly turnToHaveSelectedCards: (props: {
      gameId: string;
      selectedCards: ReadonlyArray<{
        cardId: string;
        playerId: string;
      }>;
    }) => Effect.Effect<void, never, never>;
    readonly turnToBeInVotingPhase: (props: {
      gameId: string;
    }) => Effect.Effect<void, never, never>;
    readonly playerToNotHaveBeenAbleToSubmitClue: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly playerToNotHaveBeenAbleToSelectCard: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly playerToHaveVotedOnCard: (props: {
      gameId: string;
      votedBy: string;
      ownedBy: string;
      cardId: string;
    }) => Effect.Effect<void, never, never>;
    readonly playerToNotHaveBeenAbleToVoteOnCard: (props?: {
      error?: string;
    }) => Effect.Effect<void, never, never>;
    readonly turnToBeInScoringPhase: (props: {
      gameId: string;
    }) => Effect.Effect<void, never, never>;
    readonly playersToHaveScore: (props: {
      gameId: string;
      scores: ReadonlyArray<{
        playerId: string;
        score: number;
      }>;
    }) => Effect.Effect<void, never, never>;
  };
}

export class GameDriver extends Context.Tag("GameDriver")<
  GameDriver,
  GameDriverDSL
>() {}

const NUMBER_OF_CARDS_IN_DECK = 100;

const makeUnitTestGameDriver = ({
  createGameUseCase,
  joinGameUseCase,
  leaveGameUseCase,
  startGameUseCase,
  submitClueUseCase,
  selectCardUseCase,
  voteOnCardUseCase,
  gameRepository,
  deckRepository,
}: {
  createGameUseCase: CreateGameUseCase;
  joinGameUseCase: JoinGameUseCase;
  leaveGameUseCase: LeaveGameUseCase;
  startGameUseCase: StartGameUseCase;
  submitClueUseCase: SubmitClueUseCase;
  selectCardUseCase: SelectCardUseCase;
  voteOnCardUseCase: VoteOnCardUseCase;
  gameRepository: Context.Tag.Service<GameRepository>;
  deckRepository: Context.Tag.Service<DeckRepository>;
}): GameDriverDSL => {
  const testState = {
    currentError: Option.none<Error>(),
    failFast: false,
  };

  const given: GameDriverDSL["given"] = {
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
            })
          ),
      });
      return deckRepository.save(deck);
    },
    existingDeck: (props) => {
      /* This will be replaced by the real create deck use case*/
      const cards = (props.cards ?? []).map((card) =>
        Card.create({ id: CardId(card), url: `https://example.com/${card}` })
      );
      return deckRepository.save(
        DeckEntity.create({
          id: DeckId(props.id),
          isDefault: false,
          cards,
          shuffleStrategy: props.shuffleStrategy === "identity"
            ? new IdentityDeckShuffleStrategy()
            : new IdentityDeckShuffleStrategy(), // TODO: Implement shuffle strategy
        }),
      );
    },
    existingNonStartedGame: (props) => {
      return Effect.gen(function* () {
        let { deckId } = props;
        if (!deckId) {
          deckId = "default-deck-id";
          yield* given.defaultDeck({ id: "default-deck-id" });
        }

        yield* when.creatingGame({
          gameId: props.gameId,
          hostId: props.hostId,
          deckId,
          endCondition: {
            type: "NumberOfTimesBeingStoryteller",
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
              })
            ),
        );
      });
    },
    existingFullGame: (props) => {
      return Effect.gen(function* () {
        yield* given.existingNonStartedGame({
          gameId: props.gameId,
          hostId: "id-player-1",
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
          deck: {
            id: deck.props.id,
            cards: deck.props.cards.map((card) => card.id),
          },
        };
      });
    },
  };

  const when: GameDriverDSL["when"] = {
    creatingGame: (props) =>
      createGameUseCase.createGame({
        gameId: props.gameId,
        hostId: props.hostId,
        deckId: Option.fromNullable(props.deckId),
        endCondition: Option.fromNullable(props.endCondition).pipe(
          Option.map((endCondition) =>
            endCondition.type === "NumberOfTimesBeingStoryteller"
              ? {
                type: "NumberOfTimesBeingStoryteller",
                numberOfTimes: Option.some(endCondition.numberOfTimes),
              }
              : {
                type: "LimitOfPoints",
                limit: endCondition.limit,
              }
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
              return Effect.die(new Error(`[GameBuilder] ${error.message}`));
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
  };

  const assert: GameDriverDSL["assert"] = {
    createdGameToEqual: (game) =>
      Effect.gen(function* () {
        const createdGame = yield* gameRepository.findById(game.id);

        const defaultEndCondition = {
          type: "NumberOfTimesBeingStoryteller",
          numberOfTimes: 3,
        };

        Option.map(createdGame, (gameEntity) =>
          expect(gameEntity.toSnapshot()).toEqual({
            status: {
              _tag: "NotStartedGame",
            },
            id: game.id,
            createdBy: game.createdBy,
            deckId: game.deckId,
            endCondition: game.endCondition ?? defaultEndCondition,
            players: game.players,
            version: 1,
          }));
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
        expect(testState.currentError).toEqual(
          Option.some(new Error(props?.error)),
        );
      }),
    playerToNotHaveBeenAbleToLeaveGame: (props) =>
      Effect.sync(() => {
        expect(testState.currentError).toEqual(
          Option.some(new Error(props?.error)),
        );
      }),
    playerToNotHaveBeenAbleToStartGame: (props) =>
      Effect.sync(() => {
        expect(testState.currentError).toEqual(
          Option.some(new Error(props?.error)),
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
            phase: "storytelling",
            turnNumber: 1,
          }),
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
        expect(game.toSnapshot().currentTurn.phase).toEqual("selecting-cards");
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
        expect(game.toSnapshot().currentTurn.phase).toEqual("voting");
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
        expect(game.toSnapshot().currentTurn.phase).toEqual("scoring");
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
        expect(testState.currentError).toEqual(
          Option.some(new Error(props?.error)),
        );
      }),
    playerToNotHaveBeenAbleToSelectCard: (props) =>
      Effect.sync(() => {
        expect(testState.currentError).toEqual(
          Option.some(new Error(props?.error)),
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
        expect(testState.currentError).toEqual(
          Option.some(new Error(props?.error)),
        );
      }),
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

  const withFailFastMode = (): GameDriverDSL => {
    testState.failFast = true;
    return { given, when, assert, withFailFastMode, getGameSnapshot };
  };

  return { given, when, assert, withFailFastMode, getGameSnapshot };
};

export const makeGameDriverUnitTestLayer = (props?: {
  randomizeStrategy?: PlayersRandomizeStrategyType;
}) =>
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
      const gameRepository = yield* GameRepository;
      const deckRepository = yield* DeckRepository;

      return makeUnitTestGameDriver({
        createGameUseCase,
        joinGameUseCase,
        leaveGameUseCase,
        startGameUseCase,
        submitClueUseCase,
        selectCardUseCase,
        voteOnCardUseCase,
        gameRepository,
        deckRepository,
      });
    }),
  ).pipe(
    Layer.provide(GameLayerWithoutDependencies),
    Layer.provide(
      Layer.mergeAll(
        InMemoryGameRepository,
        InMemoryDeckRepository,
        props?.randomizeStrategy
          ? Layer.succeed(PlayersRandomizeStrategy, props.randomizeStrategy)
          : NoopRandomizeStrategy,
      ),
    ),
  );
