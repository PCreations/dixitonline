import {
  Array as Arr,
  Brand,
  Context,
  Data,
  Effect,
  Layer,
  Option,
  pipe,
} from "effect";
import { NonEmptyReadonlyArray } from "effect/Array";
import { Card, CardId, DeckEntity, DeckId } from "./deck.entity.js";
import { PlayerId } from "./player.entity.js";
import { TurnEntity, TurnId } from "./turn.entity.js";

export type GameId = string & Brand.Brand<"GameId">;

export const GameId = Brand.nominal<GameId>();

export enum EndConditionType {
  NumberOfTimesBeingStoryteller = "number-of-times-being-storyteller",
  LimitOfPoints = "limit-of-points",
}

const DEFAULT_NUMBER_OF_TIMES_BEING_STORYTELLER = 3;

export type NumberOfTimesBeingStorytellerEndCondition = {
  readonly numberOfTimes: number;
};

export type LimitOfPointsEndCondition = {
  readonly limit: number;
};

export type EndCondition = Data.TaggedEnum<{
  NumberOfTimesBeingStoryteller: NumberOfTimesBeingStorytellerEndCondition;
  LimitOfPoints: LimitOfPointsEndCondition;
}>;

const {
  $match: $matchEndCondition,
  NumberOfTimesBeingStoryteller: NumberOfTimesBeingStorytellerEndCondition,
  LimitOfPoints: LimitOfPointsEndCondition,
} = Data.taggedEnum<EndCondition>();

const endConditionToSnapshot = (endCondition: EndCondition) =>
  $matchEndCondition(endCondition, {
    NumberOfTimesBeingStoryteller: (endCondition) => ({
      type: endCondition._tag,
      numberOfTimes: endCondition.numberOfTimes,
    }),
    LimitOfPoints: (endCondition) => ({
      type: endCondition._tag,
      limit: endCondition.limit,
    }),
  });

const endConditionFromSnapshot = (
  snapshot: ReturnType<typeof endConditionToSnapshot>,
) => {
  return snapshot.type === "NumberOfTimesBeingStoryteller"
    ? NumberOfTimesBeingStorytellerEndCondition({
      numberOfTimes: snapshot.numberOfTimes,
    })
    : LimitOfPointsEndCondition({
      limit: snapshot.limit,
    });
};

export const createNumberOfTimesBeingStorytellerEndCondition = (props: {
  numberOfTimes: Option.Option<number>;
}) =>
  NumberOfTimesBeingStorytellerEndCondition({
    numberOfTimes: Option.getOrElse(
      props.numberOfTimes,
      () => DEFAULT_NUMBER_OF_TIMES_BEING_STORYTELLER,
    ),
  });

export const createLimitOfPointsEndCondition = (props: { limit: number }) =>
  LimitOfPointsEndCondition({
    limit: props.limit,
  });

export const MAX_PLAYERS = 6;
export const MIN_PLAYERS = 3;

const isNonEmptyReadonlyArray = <T>(
  array: ReadonlyArray<T>,
): array is NonEmptyReadonlyArray<T> => {
  return Arr.isNonEmptyReadonlyArray(array);
};

export class PlayerHand {
  private constructor(
    private readonly props: {
      readonly playerId: PlayerId;
      readonly cards: NonEmptyReadonlyArray<Card>;
    },
  ) {}

  static create(
    props: { playerId: PlayerId; cards: NonEmptyReadonlyArray<Card> },
  ) {
    return new PlayerHand(props);
  }

  get playerId() {
    return this.props.playerId;
  }

  get cards() {
    return this.props.cards;
  }

  isCardInHand(cardId: CardId) {
    return this.props.cards.some((card) => card.id === cardId);
  }

  removeCard(cardId: CardId) {
    const newCards = this.props.cards.filter((card) =>
      card.id !== cardId
    ) as unknown as NonEmptyReadonlyArray<Card>;
    if (!isNonEmptyReadonlyArray(newCards)) {
      return Effect.fail(new Error("Player hand cannot be empty"));
    }
    return Effect.succeed(
      new PlayerHand({
        ...this.props,
        cards: newCards,
      }),
    );
  }
}

const CARD_PER_PLAYER = 6;

export class PlayersRandomizeStrategy
  extends Context.Tag("game/PlayersRandomizeStrategy")<
    PlayersRandomizeStrategy,
    {
      readonly type: string;
      randomize: (
        players: NonEmptyReadonlyArray<PlayerId>,
      ) => NonEmptyReadonlyArray<PlayerId>;
    }
  >() {}

export type PlayersRandomizeStrategyType = Context.Tag.Service<
  PlayersRandomizeStrategy
>;

const makeNoopRandomizeStrategy = (): PlayersRandomizeStrategyType => {
  return {
    type: "noop",
    randomize: (players) => players,
  };
};

export const NoopRandomizeStrategy = Layer.sync(
  PlayersRandomizeStrategy,
  makeNoopRandomizeStrategy,
);

const makeShuffleRandomizeStrategy = (): PlayersRandomizeStrategyType => {
  return {
    type: "shuffle",
    randomize: (players) => {
      return Arr.sort(players, () => (Math.random() < 0.5 ? -1 : 1));
    },
  };
};

export const ShuffleRandomizeStrategy = Layer.sync(
  PlayersRandomizeStrategy,
  makeShuffleRandomizeStrategy,
);

export type GameStatus = Data.TaggedEnum<{
  NotStartedGame: {};
  StartedGame: {};
}>;

const {
  $is,
  NotStartedGame: NotStartedGameStatus,
  StartedGame: StartedGameStatus,
} = Data.taggedEnum<GameStatus>();

export const isNotStartedGame = (
  game: GameEntity,
): game is NotStartedGameEntity => $is("NotStartedGame")(game.status);

export const isStartedGame = (game: GameEntity): game is StartedGameEntity =>
  $is("StartedGame")(game.status);

export abstract class GameEntity {
  abstract readonly status: GameStatus;

  protected constructor(
    protected readonly props: {
      readonly id: GameId;
      readonly createdBy: PlayerId;
      readonly deckId: DeckId;
      readonly endCondition: EndCondition;
      players: NonEmptyReadonlyArray<PlayerId>;
      readonly version: number;
    },
  ) {}

  protected abstract createInstance(props: GameEntity["props"]): this;

  get id() {
    return this.props.id;
  }

  get version() {
    return this.props.version;
  }

  get deckId() {
    return this.props.deckId;
  }

  removePlayer(playerId: PlayerId) {
    return Effect.suspend(() => {
      if (!this.props.players.includes(playerId)) {
        return Effect.fail(new Error("Player not in game"));
      }

      if (playerId === this.props.createdBy) {
        return Effect.fail(new Error("Host cannot leave the game"));
      }

      const updatedPlayers = Arr.filter(
        this.props.players,
        (player) => player !== playerId,
      );

      if (!isNonEmptyReadonlyArray(updatedPlayers)) {
        return Effect.fail(new Error("Game is empty"));
      }

      return Effect.succeed(
        this.createInstance({
          ...this.props,
          players: updatedPlayers,
          version: this.props.version + 1,
        }),
      );
    });
  }

  toSnapshot() {
    return {
      id: this.props.id as string,
      status: this.status,
      createdBy: this.props.createdBy as string,
      deckId: this.props.deckId as string,
      endCondition: endConditionToSnapshot(this.props.endCondition),
      players: this.props.players as ReadonlyArray<string>,
      version: this.props.version,
    };
  }
}

export class NotStartedGameEntity extends GameEntity {
  readonly status = NotStartedGameStatus();

  private constructor(props: GameEntity["props"]) {
    super({
      ...props,
      players: NotStartedGameEntity.ensurePlayersIncludeCreator(
        props.players,
        props.createdBy,
      ),
    });
  }

  private static ensurePlayersIncludeCreator(
    players: ReadonlyArray<PlayerId>,
    createdBy: PlayerId,
  ): NonEmptyReadonlyArray<PlayerId> {
    return Arr.isNonEmptyReadonlyArray(players) ? players : Arr.of(createdBy);
  }

  protected createInstance(props: GameEntity["props"]): this {
    return new NotStartedGameEntity(props) as this;
  }

  static create(props: {
    id: GameId;
    createdBy: PlayerId;
    deckId: DeckId;
    endCondition: EndCondition;
  }) {
    return new NotStartedGameEntity({
      ...props,
      players: Arr.of(props.createdBy),
      version: 1,
    });
  }

  addPlayer(playerId: PlayerId) {
    return Effect.suspend(() => {
      if (this.props.players.includes(playerId)) {
        return Effect.fail(new Error(`Player already in game: ${playerId}`));
      }

      if (this.props.players.length >= MAX_PLAYERS) {
        return Effect.fail(new Error("Game is full"));
      }

      const updatedPlayers = Arr.append(this.props.players, playerId);

      return Effect.succeed(
        new NotStartedGameEntity({
          ...this.props,
          players: updatedPlayers,
          version: this.props.version + 1,
        }),
      );
    });
  }

  start(opts: {
    playerId: PlayerId;
    deck: DeckEntity;
    startedAt: Date;
    randomizeStrategy: PlayersRandomizeStrategyType;
  }) {
    return Effect.suspend(() => {
      const { playerId, deck, startedAt, randomizeStrategy } = opts;
      if (this.props.players.length < MIN_PLAYERS) {
        return Effect.fail(
          new Error("The game does not meet the minimum number of players"),
        );
      }

      if (!this.props.players.includes(playerId)) {
        return Effect.fail(new Error("Player not in game"));
      }

      if (playerId !== this.props.createdBy) {
        return Effect.fail(new Error("Only the host can start the game"));
      }

      return this.startGameWithDeck(deck, startedAt, randomizeStrategy);
    });
  }

  private guardAgainstEmptyDeck(deck: DeckEntity) {
    if (deck.props.cards.length === 0) {
      return Effect.fail(new Error("The deck is empty"));
    }

    return Effect.succeed(void 0);
  }

  private guardAgainstDeckTooSmall(deck: DeckEntity) {
    if (
      deck.props.cards.length <
        this.getNumberOfCardsPerPlayer() * this.props.players.length
    ) {
      return Effect.fail(
        new Error(
          `The deck is too small. It has ${deck.props.cards.length} cards, but at least ${
            this.getNumberOfCardsPerPlayer() * this.props.players.length
          } cards are needed.`,
        ),
      );
    }

    return Effect.succeed(void 0);
  }

  private startGameWithDeck(
    deck: DeckEntity,
    startedAt: Date,
    randomizeStrategy: PlayersRandomizeStrategyType,
  ) {
    return Effect.gen(this, function* () {
      yield* this.guardAgainstEmptyDeck(deck);
      yield* this.guardAgainstDeckTooSmall(deck);
      this.props.players = randomizeStrategy.randomize(this.props.players);
      const shuffledCards = deck.getShuffledCards();
      const [hands, remainingCards] = this.dealCards({
        cards: shuffledCards,
      });

      const turn = TurnEntity.create({
        id: TurnId(`${this.props.id}-turn-1`),
        gameId: this.props.id,
        currentStorytellerId: this.props.players[0],
        playerHands: hands,
        cardsInDrawPile: remainingCards,
        startedAt: startedAt,
      });

      return yield* Effect.succeed(
        StartedGameEntity.create({
          ...this.props,
          currentTurn: turn,
          version: this.props.version + 1,
          randomizeStrategy,
        }),
      );
    });
  }

  private dealCards(props: {
    cards: ReadonlyArray<Card>;
  }) {
    const [cardsChunk, remainingCards] = pipe(
      Arr.splitAt(
        props.cards,
        this.getNumberOfCardsPerPlayer() * this.props.players.length,
      ),
      ([cards, remainingCards]) => [
        Arr.chunksOf(cards, this.getNumberOfCardsPerPlayer()),
        remainingCards,
      ],
    );

    const hands = Arr.map(this.props.players, (playerId, index) => {
      return PlayerHand.create({
        playerId,
        cards: cardsChunk[index],
      });
    });

    return [hands, remainingCards] as const;
  }

  private getNumberOfCardsPerPlayer() {
    return this.props.players.length === 3
      ? CARD_PER_PLAYER + 1
      : CARD_PER_PLAYER;
  }

  static fromSnapshot(
    snapshot: Omit<ReturnType<NotStartedGameEntity["toSnapshot"]>, "status">,
  ) {
    const createdBy = PlayerId(snapshot.createdBy);
    const playerIds = snapshot.players.map((playerId) => PlayerId(playerId));

    return new NotStartedGameEntity({
      id: GameId(snapshot.id),
      createdBy,
      deckId: DeckId(snapshot.deckId),
      endCondition: endConditionFromSnapshot(snapshot.endCondition),
      players: NotStartedGameEntity.ensurePlayersIncludeCreator(
        playerIds,
        createdBy,
      ),
      version: snapshot.version,
    });
  }
}

export class StartedGameEntity extends GameEntity {
  readonly status = StartedGameStatus();

  private constructor(
    readonly props: GameEntity["props"] & {
      currentTurn: TurnEntity;
      randomizeStrategy: PlayersRandomizeStrategyType;
    },
  ) {
    super(props);
  }

  static create(
    props: GameEntity["props"] & {
      currentTurn: TurnEntity;
      randomizeStrategy: PlayersRandomizeStrategyType;
    },
  ) {
    return new StartedGameEntity(props);
  }

  protected createInstance(
    props: GameEntity["props"] & {
      currentTurn: TurnEntity;
      randomizeStrategy: PlayersRandomizeStrategyType;
    },
  ): this {
    return new StartedGameEntity(props) as this;
  }

  static fromSnapshot(
    snapshot: Omit<ReturnType<StartedGameEntity["toSnapshot"]>, "status">,
  ) {
    return new StartedGameEntity({
      id: GameId(snapshot.id),
      createdBy: PlayerId(snapshot.createdBy),
      deckId: DeckId(snapshot.deckId),
      endCondition: endConditionFromSnapshot(snapshot.endCondition),
      players: snapshot.players.map((playerId) =>
        PlayerId(playerId)
      ) as unknown as NonEmptyReadonlyArray<PlayerId>,
      version: snapshot.version,
      currentTurn: TurnEntity.fromSnapshot(snapshot.currentTurn),
      randomizeStrategy: snapshot.randomizeStrategy === "noop"
        ? PlayersRandomizeStrategy.of(makeNoopRandomizeStrategy())
        : PlayersRandomizeStrategy.of(makeNoopRandomizeStrategy()), // TODO: Implement factory
    });
  }

  toSnapshot() {
    return {
      ...super.toSnapshot(),
      players: this.props.players as ReadonlyArray<string>,
      currentTurn: this.props.currentTurn.toSnapshot(),
      randomizeStrategy: this.props.randomizeStrategy.type,
    };
  }

  submitClue(opts: {
    playerId: PlayerId;
    cardId: CardId;
    clue: string;
  }) {
    return Effect.gen(this, function* () {
      const updatedTurn = yield* this.props.currentTurn.submitClue({
        playerId: opts.playerId,
        clue: opts.clue,
        cardId: opts.cardId,
      });

      return StartedGameEntity.create({
        ...this.props,
        currentTurn: updatedTurn,
        version: this.props.version + 1,
      });
    });
  }

  selectCard(opts: {
    playerId: PlayerId;
    cardId: CardId;
  }) {
    return Effect.gen(this, function* () {
      const updatedTurn = yield* this.props.currentTurn.selectCard({
        playerId: opts.playerId,
        cardId: opts.cardId,
      });

      return StartedGameEntity.create({
        ...this.props,
        currentTurn: updatedTurn,
        version: this.props.version + 1,
      });
    });
  }
}

export type NotStartedGameSnapshot = ReturnType<NotStartedGameEntity["toSnapshot"]>;
export type StartedGameSnapshot = ReturnType<StartedGameEntity["toSnapshot"]>;
export type GameEntitySnapshot = NotStartedGameSnapshot | StartedGameSnapshot;

export const isNotStartedGameSnapshot = (
  snapshot: GameEntitySnapshot,
): snapshot is NotStartedGameSnapshot => {
  return snapshot.status._tag === "NotStartedGame";
};

export const isStartedGameSnapshot = (
  snapshot: GameEntitySnapshot,
): snapshot is StartedGameSnapshot => {
  return snapshot.status._tag === "StartedGame";
};
