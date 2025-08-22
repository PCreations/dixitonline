import { Array as Arr, Brand, Data, Effect, Option, pipe } from "effect";
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
      readonly cards: ReadonlyArray<Card>;
    },
  ) {}

  static create(props: { playerId: PlayerId; cards: ReadonlyArray<Card> }) {
    return new PlayerHand(props);
  }

  get playerId() {
    return this.props.playerId;
  }

  get cards() {
    return this.props.cards;
  }
}

const CARD_PER_PLAYER = 6;

export interface RandomizeStrategy {
  randomize(
    players: NonEmptyReadonlyArray<PlayerId>,
  ): NonEmptyReadonlyArray<PlayerId>;
}

export class NoopRandomizeStrategy implements RandomizeStrategy {
  randomize(
    players: NonEmptyReadonlyArray<PlayerId>,
  ): NonEmptyReadonlyArray<PlayerId> {
    return players;
  }
}

export abstract class GameEntity {
  abstract readonly _tag: string;
  protected constructor(
    protected readonly props: {
      readonly id: GameId;
      readonly createdBy: PlayerId;
      readonly deckId: DeckId;
      readonly endCondition: EndCondition;
      players: NonEmptyReadonlyArray<PlayerId>;
      readonly version: number;
    },
    protected readonly randomizeStrategy: RandomizeStrategy =
      new NoopRandomizeStrategy(),
  ) {
    this.props.players = this.randomizeStrategy.randomize(this.props.players);
  }

  get id() {
    return this.props.id;
  }

  get version() {
    return this.props.version;
  }

  get deckId() {
    return this.props.deckId;
  }

  toSnapshot() {
    return {
      id: this.props.id as string,
      _tag: this._tag,
      createdBy: this.props.createdBy as string,
      deckId: this.props.deckId as string,
      endCondition: endConditionToSnapshot(this.props.endCondition),
      players: this.props.players as ReadonlyArray<string>,
      version: this.props.version,
    };
  }
}

export class NotStartedGameEntity extends GameEntity {
  readonly _tag = "NotStartedGame";

  private constructor(props: GameEntity["props"], opts: {
    randomizeStrategy?: RandomizeStrategy;
  } = {}) {
    super({
      ...props,
      players: NotStartedGameEntity.ensurePlayersIncludeCreator(
        props.players,
        props.createdBy,
      ),
    }, opts.randomizeStrategy);
  }

  private static ensurePlayersIncludeCreator(
    players: ReadonlyArray<PlayerId>,
    createdBy: PlayerId,
  ): NonEmptyReadonlyArray<PlayerId> {
    return Arr.isNonEmptyReadonlyArray(players) ? players : Arr.of(createdBy);
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
        return Effect.fail(new Error("Player already in game"));
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
  }) {
    return Effect.suspend(() => {
      const { playerId, deck, startedAt } = opts;
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

      return this.startGameWithDeck(deck, startedAt);
    });
  }

  private startGameWithDeck(deck: DeckEntity, startedAt: Date) {
    const shuffledCards = deck.getShuffledCards();
    const [hands, remainingCards] = this.dealCards({
      cards: shuffledCards,
      players: this.props.players,
    });

    const turn = TurnEntity.create({
      id: TurnId(`${this.props.id}-turn-1`),
      gameId: this.props.id,
      currentStorytellerId: this.props.players[0],
      playerHands: hands,
      cardsInDrawPile: remainingCards,
      turnStartedAt: startedAt,
    });

    return Effect.succeed(
      StartedGameEntity.create({
        ...this.props,
        currentTurn: turn,
        version: this.props.version + 1,
      }),
    );
  }

  private dealCards(props: {
    cards: ReadonlyArray<Card>;
    players: ReadonlyArray<PlayerId>;
  }) {
    const [cardsChunk, remainingCards] = pipe(
      Arr.splitAt(
        props.cards,
        this.getNumberOfCardsPerPlayer(props.players) * props.players.length,
      ),
      ([cards, remainingCards]) => [
        Arr.chunksOf(cards, this.getNumberOfCardsPerPlayer(props.players)),
        remainingCards,
      ],
    );

    const hands = Arr.map(props.players, (playerId, index) => {
      return PlayerHand.create({
        playerId,
        cards: cardsChunk[index],
      });
    });

    return [hands, remainingCards] as const;
  }

  private getNumberOfCardsPerPlayer(players: ReadonlyArray<PlayerId>) {
    return players.length === 3 ? CARD_PER_PLAYER + 1 : CARD_PER_PLAYER;
  }

  static fromSnapshot(
    snapshot: Omit<ReturnType<NotStartedGameEntity["toSnapshot"]>, "_tag">,
    opts: {
      randomizeStrategy?: RandomizeStrategy;
    } = {},
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
    }, opts);
  }
}

export class StartedGameEntity extends GameEntity {
  readonly _tag = "StartedGame";

  private constructor(
    readonly props: GameEntity["props"] & {
      currentTurn: TurnEntity;
    },
  ) {
    super(props);
  }

  static create(
    props: GameEntity["props"] & {
      currentTurn: TurnEntity;
    },
  ) {
    return new StartedGameEntity(props);
  }

  static fromSnapshot(
    snapshot: Omit<ReturnType<StartedGameEntity["toSnapshot"]>, "_tag">,
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
    });
  }

  toSnapshot() {
    return {
      ...super.toSnapshot(),
      players: this.props.players as ReadonlyArray<string>,
      currentTurn: this.props.currentTurn.toSnapshot(),
    };
  }

  submitClue(opts: {
    playerId: PlayerId;
    gameId: GameId;
    cardId: CardId;
    clue: string;
  }) {
    return Effect.gen(this, function* () {
      const updatedTurn = yield* this.props.currentTurn.submitClue({
        playerId: opts.playerId,
        clue: opts.clue,
      });

      return StartedGameEntity.create({
        ...this.props,
        currentTurn: updatedTurn,
        version: this.props.version + 1,
      });
    });
  }
}
