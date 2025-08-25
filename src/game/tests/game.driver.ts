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
  GameStatus,
  isStartedGame,
  MAX_PLAYERS,
  MIN_PLAYERS,
  NoopRandomizeStrategy,
  PlayersRandomizeStrategy,
  PlayersRandomizeStrategyType,
} from "../game.entity.js";
import { GameRepository, InMemoryGameRepository } from "../game.repository.js";
import { GameLayerWithoutDependencies } from "../index.js";
import { JoinGameUseCase } from "../join-game.usecase.js";
import { LeaveGameUseCase } from "../leave-game.usecase.js";
import { StartGameUseCase } from "../start-game.usecase.js";

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
  readonly given: {
    readonly defaultDeck: (
      props: { id: string; withShuffledCards?: ReadonlyArray<string> },
    ) => Effect.Effect<void>;
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
      status?: GameStatus;
    }) => Effect.Effect<void>;
    readonly existingFullGame: (props: {
      gameId: string;
    }) => Effect.Effect<void>;
    readonly existingGameWithMinimumNumberOfPlayers: (props: {
      gameId: string;
      hostId: string;
    }) => Effect.Effect<void>;
  };
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
  };
}

export class GameDriver extends Context.Tag("GameDriver")<
  GameDriver,
  GameDriverDSL
>() {}

const makeUnitTestGameDriver = ({
  createGameUseCase,
  joinGameUseCase,
  leaveGameUseCase,
  startGameUseCase,
  gameRepository,
  deckRepository,
}: {
  createGameUseCase: CreateGameUseCase;
  joinGameUseCase: JoinGameUseCase;
  leaveGameUseCase: LeaveGameUseCase;
  startGameUseCase: StartGameUseCase;
  gameRepository: Context.Tag.Service<GameRepository>;
  deckRepository: Context.Tag.Service<DeckRepository>;
}): GameDriverDSL => {
  const testState = {
    currentError: Option.none<Error>(),
  };

  const given: GameDriverDSL["given"] = {
    defaultDeck: (props) =>
      deckRepository.save(
        DeckEntity.createDefault({
          id: DeckId(props.id),
          cards: new Array(24).fill(0).map((_, i) =>
            Card.create({
              id: CardId(`card-${i + 1}`),
              url: `https://example.com/card-${i + 1}`,
            })
          ),
        }),
      ),
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
          (props.players ?? []).map((player) =>
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
    existingGameWithMinimumNumberOfPlayers: (props) => {
      return Effect.gen(function* () {
        yield* given.existingNonStartedGame({
          gameId: props.gameId,
          hostId: props.hostId,
          players: Array.from(
            { length: MIN_PLAYERS },
            (_, i) => `id-player-${i + 1}`,
          ),
        });
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
    joiningGame: (props) =>
      joinGameUseCase
        .joinGame({
          gameId: props.gameId,
          playerId: props.playerId,
        })
        .pipe(
          Effect.catchAll((error) => {
            testState.currentError = Option.some(error);
            return Effect.succeed(void 0);
          }),
        ),
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
            testState.currentError = Option.some(error);
            return Effect.succeed(void 0);
          }),
        );
    },
    startingGame: (props) => {
      return startGameUseCase.startGame({
        gameId: props.gameId,
        playerId: props.playerId,
      }).pipe(
        Effect.catchAll((error) => {
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
        const game = Option.getOrThrow(
          yield* gameRepository.findStartedGameById(props.gameId),
        );
        expect(isStartedGame(game)).toBe(true);
      });
    },
    currentTurnToBeStarted: (props) => {
      return Effect.gen(function* () {
        const game = Option.getOrThrow(
          yield* gameRepository.findStartedGameById(props.gameId),
        );
        expect(game.toSnapshot().currentTurn).toEqual(expect.objectContaining({
          currentStorytellerId: props.storytellerId,
          phase: "storytelling",
          turnNumber: 1,
        }));
      });
    },
    playerHandsToEqual: (props) => {
      return Effect.gen(function* () {
        const game = Option.getOrThrow(
          yield* gameRepository.findStartedGameById(props.gameId),
        );
        expect(
          game.toSnapshot().currentTurn.playerHands.map((hand) => ({
            playerId: hand.playerId,
            cards: hand.cards.map((card) => card.id),
          })),
        ).toEqual(
          props.playerHands,
        );
      });
    },
  };

  return {
    given,
    when,
    assert,
  };
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
      const gameRepository = yield* GameRepository;
      const deckRepository = yield* DeckRepository;

      return makeUnitTestGameDriver({
        createGameUseCase,
        joinGameUseCase,
        leaveGameUseCase,
        startGameUseCase,
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
