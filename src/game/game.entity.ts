import {
  Array as Arr,
  Brand,
  Context,
  Data,
  Effect,
  Layer,
  Option,
  pipe,
} from 'effect';
import { NonEmptyReadonlyArray } from 'effect/Array';
import { Card, CardId, DeckEntity, DeckId } from './deck.entity.js';
import {
  CardSelected,
  type CardSelectedEvent,
  ClueSubmitted,
  type ClueSubmittedEvent,
  GameEnded,
  type GameEndedEvent,
  type GameEvent,
  GameStarted,
  type GameStartedEvent,
  PlayerJoined,
  type PlayerJoinedEvent,
  PlayerLeft,
  type PlayerLeftEvent,
  TurnScored,
  type TurnScoredEvent,
  VoteSubmitted,
  type VoteSubmittedEvent,
} from './game-events.js';
import { GameRulesFactory } from './game-rules.js';
import { PlayerId } from './player.entity.js';
import { TurnEntity, TurnId } from './turn.entity.js';

/**
 * Result of an entity mutation that produces domain events.
 * @template TEntity The entity type after mutation
 * @template TEvent The specific event type(s) produced by this mutation
 */
export type EntityWithEvents<TEntity, TEvent extends GameEvent = GameEvent> = {
  readonly entity: TEntity;
  readonly events: ReadonlyArray<TEvent>;
};

export type GameId = string & Brand.Brand<'GameId'>;

export const GameId = Brand.nominal<GameId>();

export enum EndConditionType {
  NumberOfTimesBeingStoryteller = 'number-of-times-being-storyteller',
  LimitOfPoints = 'limit-of-points',
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
  return snapshot.type === 'NumberOfTimesBeingStoryteller'
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

  static create(props: {
    playerId: PlayerId;
    cards: NonEmptyReadonlyArray<Card>;
  }) {
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

  completeFromDrawPile(
    cardsInDrawPile: ReadonlyArray<Card>,
    numberOfCards: number,
  ) {
    const [drawnCards, remainingCards] = Arr.splitAt(
      cardsInDrawPile,
      numberOfCards - this.props.cards.length,
    );
    return [this.addCards(drawnCards), remainingCards] as const;
  }

  private addCards(cards: ReadonlyArray<Card>) {
    return new PlayerHand({
      ...this.props,
      cards: [...this.props.cards, ...cards],
    });
  }

  removeCard(cardId: CardId) {
    const newCards = this.props.cards.filter(
      (card) => card.id !== cardId,
    ) as unknown as NonEmptyReadonlyArray<Card>;
    if (!isNonEmptyReadonlyArray(newCards)) {
      return Effect.fail(new Error('Player hand cannot be empty'));
    }
    return Effect.succeed(
      new PlayerHand({
        ...this.props,
        cards: newCards,
      }),
    );
  }
}

export class PlayersRandomizeStrategy extends Context.Tag(
  'game/PlayersRandomizeStrategy',
)<
  PlayersRandomizeStrategy,
  {
    readonly type: string;
    randomize: (
      players: NonEmptyReadonlyArray<PlayerId>,
    ) => NonEmptyReadonlyArray<PlayerId>;
  }
>() {}

export type PlayersRandomizeStrategyType =
  Context.Tag.Service<PlayersRandomizeStrategy>;

const makeNoopRandomizeStrategy = (): PlayersRandomizeStrategyType => {
  return {
    type: 'noop',
    randomize: (players) => players,
  };
};

export const NoopRandomizeStrategy = Layer.sync(
  PlayersRandomizeStrategy,
  makeNoopRandomizeStrategy,
);

const makeShuffleRandomizeStrategy = (): PlayersRandomizeStrategyType => {
  return {
    type: 'shuffle',
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
  EndedGame: {};
}>;

export const {
  $is,
  NotStartedGame: NotStartedGameStatus,
  StartedGame: StartedGameStatus,
  EndedGame: EndedGameStatus,
} = Data.taggedEnum<GameStatus>();

export const isNotStartedGame = (
  game: GameEntity,
): game is NotStartedGameEntity => $is('NotStartedGame')(game.status);

export const isStartedGame = (game: GameEntity): game is StartedGameEntity =>
  $is('StartedGame')(game.status);

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

  protected abstract createInstance(props: GameEntity['props']): this;

  get id() {
    return this.props.id;
  }

  get version() {
    return this.props.version;
  }

  get deckId() {
    return this.props.deckId;
  }

  removePlayer(
    playerId: PlayerId,
  ): Effect.Effect<EntityWithEvents<GameEntity, PlayerLeftEvent>, Error> {
    return Effect.suspend(() => {
      if (!this.props.players.includes(playerId)) {
        return Effect.fail(new Error('Player not in game'));
      }

      if (playerId === this.props.createdBy) {
        return Effect.fail(new Error('Host cannot leave the game'));
      }

      const updatedPlayers = Arr.filter(
        this.props.players,
        (player) => player !== playerId,
      );

      if (!isNonEmptyReadonlyArray(updatedPlayers)) {
        return Effect.fail(new Error('Game is empty'));
      }

      const updatedEntity = this.createInstance({
        ...this.props,
        players: updatedPlayers,
        version: this.props.version + 1,
      });

      return Effect.succeed({
        entity: updatedEntity,
        events: [PlayerLeft({ gameId: this.props.id, playerId })],
      });
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

  private constructor(props: GameEntity['props']) {
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

  protected createInstance(props: GameEntity['props']): this {
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

  addPlayer(
    playerId: PlayerId,
  ): Effect.Effect<
    EntityWithEvents<NotStartedGameEntity, PlayerJoinedEvent>,
    Error
  > {
    return Effect.suspend(() => {
      if (this.props.players.includes(playerId)) {
        return Effect.fail(new Error(`Player already in game: ${playerId}`));
      }

      if (this.props.players.length >= MAX_PLAYERS) {
        return Effect.fail(new Error('Game is full'));
      }

      const updatedPlayers = Arr.append(this.props.players, playerId);

      const updatedEntity = new NotStartedGameEntity({
        ...this.props,
        players: updatedPlayers,
        version: this.props.version + 1,
      });

      return Effect.succeed({
        entity: updatedEntity,
        events: [PlayerJoined({ gameId: this.props.id, playerId })],
      });
    });
  }

  start(opts: {
    playerId: PlayerId;
    deck: DeckEntity;
    startedAt: Date;
    randomizeStrategy: PlayersRandomizeStrategyType;
  }): Effect.Effect<
    EntityWithEvents<StartedGameEntity, GameStartedEvent>,
    Error
  > {
    return Effect.suspend(() => {
      const { playerId, deck, startedAt, randomizeStrategy } = opts;
      if (this.props.players.length < MIN_PLAYERS) {
        return Effect.fail(
          new Error('The game does not meet the minimum number of players'),
        );
      }

      if (!this.props.players.includes(playerId)) {
        return Effect.fail(new Error('Player not in game'));
      }

      if (playerId !== this.props.createdBy) {
        return Effect.fail(new Error('Only the host can start the game'));
      }

      return this.startGameWithDeck(deck, startedAt, randomizeStrategy);
    });
  }

  private guardAgainstEmptyDeck(deck: DeckEntity) {
    if (deck.props.cards.length === 0) {
      return Effect.fail(new Error('The deck is empty'));
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
  ): Effect.Effect<
    EntityWithEvents<StartedGameEntity, GameStartedEvent>,
    Error
  > {
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

      const entity = StartedGameEntity.create({
        ...this.props,
        currentTurn: turn,
        version: this.props.version + 1,
        randomizeStrategy,
        playersReadyForNextTurn: [],
        playersHavingBeenStoryteller: this.props.players.reduce(
          (acc, playerId) => {
            acc[playerId] = 0;
            return acc;
          },
          {} as { [playerId: string]: number },
        ),
      });

      return {
        entity,
        events: [GameStarted({ gameId: this.props.id })],
      };
    });
  }

  private dealCards(props: { cards: ReadonlyArray<Card> }) {
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
    return GameRulesFactory.createForPlayersCount(
      this.props.players.length,
    ).getNumberOfCardsInHand();
  }

  static fromSnapshot(
    snapshot: Omit<ReturnType<NotStartedGameEntity['toSnapshot']>, 'status'>,
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

type StartedGameEntityProps = GameEntity['props'] & {
  currentTurn: TurnEntity;
  randomizeStrategy: PlayersRandomizeStrategyType;
  scores: ReadonlyArray<{ playerId: PlayerId; score: number }>;
  playersReadyForNextTurn: ReadonlyArray<PlayerId>;
  playersHavingBeenStoryteller: {
    [playerId: string]: number;
  };
};

export class StartedGameEntity extends GameEntity {
  readonly status = StartedGameStatus();

  private constructor(readonly props: StartedGameEntityProps) {
    super(props);
  }

  static create(
    props: Omit<StartedGameEntityProps, 'scores'> & {
      scores?: ReadonlyArray<{ playerId: PlayerId; score: number }>;
      playersReadyForNextTurn?: ReadonlyArray<PlayerId>;
    },
  ) {
    return new StartedGameEntity({
      ...props,
      playersReadyForNextTurn:
        props.playersReadyForNextTurn === undefined
          ? []
          : props.playersReadyForNextTurn,
      scores:
        props.scores === undefined
          ? props.players.map((playerId) => ({
              playerId,
              score: 0,
            }))
          : props.scores,
    });
  }

  protected createInstance(
    props: GameEntity['props'] & {
      currentTurn: TurnEntity;
      randomizeStrategy: PlayersRandomizeStrategyType;
    },
  ): this {
    return new StartedGameEntity({
      ...props,
      scores: props.players.map((playerId) => ({
        playerId,
        score: 0,
      })),
      playersReadyForNextTurn: [],
      playersHavingBeenStoryteller: {},
    }) as this;
  }

  static fromSnapshot(
    snapshot: Omit<ReturnType<StartedGameEntity['toSnapshot']>, 'status'>,
  ) {
    return new StartedGameEntity({
      id: GameId(snapshot.id),
      createdBy: PlayerId(snapshot.createdBy),
      deckId: DeckId(snapshot.deckId),
      endCondition: endConditionFromSnapshot(snapshot.endCondition),
      players: snapshot.players.map((playerId) =>
        PlayerId(playerId),
      ) as unknown as NonEmptyReadonlyArray<PlayerId>,
      version: snapshot.version,
      currentTurn: TurnEntity.fromSnapshot(snapshot.currentTurn),
      randomizeStrategy:
        snapshot.randomizeStrategy === 'noop'
          ? PlayersRandomizeStrategy.of(makeNoopRandomizeStrategy())
          : PlayersRandomizeStrategy.of(makeShuffleRandomizeStrategy()), // TODO: Implement factory
      scores: snapshot.scores,
      playersReadyForNextTurn: snapshot.playersReadyForNextTurn,
      playersHavingBeenStoryteller: snapshot.playersHavingBeenStoryteller,
    });
  }

  toSnapshot() {
    return {
      ...super.toSnapshot(),
      currentTurn: this.props.currentTurn.toSnapshot(),
      randomizeStrategy: this.props.randomizeStrategy.type,
      scores: this.props.scores,
      playersReadyForNextTurn: this.props.playersReadyForNextTurn,
      playersHavingBeenStoryteller: this.props.playersHavingBeenStoryteller,
    };
  }

  setPlayerDeadline(playerId: PlayerId, deadline: Date): StartedGameEntity {
    const updatedTurn = this.props.currentTurn.setPlayerDeadline(
      playerId,
      deadline,
    );
    return StartedGameEntity.create({
      ...this.props,
      currentTurn: updatedTurn,
    });
  }

  clearPlayerDeadline(playerId: PlayerId): StartedGameEntity {
    const updatedTurn = this.props.currentTurn.clearPlayerDeadline(playerId);
    return StartedGameEntity.create({
      ...this.props,
      currentTurn: updatedTurn,
    });
  }

  submitClue(opts: {
    playerId: PlayerId;
    cardId: CardId;
    clue: string;
    deadlineConfig?: { now: Date; timeoutMs: number };
    wasAutoPlayed: boolean;
  }): Effect.Effect<
    EntityWithEvents<StartedGameEntity, ClueSubmittedEvent>,
    Error
  > {
    return Effect.gen(this, function* () {
      const updatedTurn = yield* this.props.currentTurn.submitClue({
        playerId: opts.playerId,
        clue: opts.clue,
        cardId: opts.cardId,
        ...(opts.deadlineConfig && { deadlineConfig: opts.deadlineConfig }),
      });

      const entity = StartedGameEntity.create({
        ...this.props,
        currentTurn: updatedTurn,
        version: this.props.version + 1,
      });

      return {
        entity,
        events: [
          ClueSubmitted({
            gameId: this.props.id,
            wasAutoPlayed: opts.wasAutoPlayed,
          }),
        ],
      };
    });
  }

  selectCard(opts: {
    playerId: PlayerId;
    cardId: CardId;
    deadlineConfig?: { now: Date; timeoutMs: number };
    wasAutoPlayed: boolean;
  }): Effect.Effect<
    EntityWithEvents<StartedGameEntity, CardSelectedEvent>,
    Error
  > {
    return Effect.gen(this, function* () {
      if (!this.props.players.includes(opts.playerId)) {
        return yield* Effect.fail(new Error('Player not in game'));
      }

      const updatedTurn = yield* this.props.currentTurn.selectCard({
        playerId: opts.playerId,
        cardId: opts.cardId,
        ...(opts.deadlineConfig && { deadlineConfig: opts.deadlineConfig }),
      });

      const entity = StartedGameEntity.create({
        ...this.props,
        currentTurn: updatedTurn,
        version: this.props.version + 1,
      });

      return {
        entity,
        events: [
          CardSelected({
            gameId: this.props.id,
            playerId: opts.playerId,
            wasAutoPlayed: opts.wasAutoPlayed,
          }),
        ],
      };
    });
  }

  voteOnCard(opts: {
    playerId: PlayerId;
    cardId: CardId;
    deadlineConfig?: { now: Date; timeoutMs: number };
    wasAutoPlayed: boolean;
  }): Effect.Effect<
    EntityWithEvents<StartedGameEntity, VoteSubmittedEvent>,
    Error
  > {
    return Effect.gen(this, function* () {
      if (!this.props.players.includes(opts.playerId)) {
        return yield* Effect.fail(new Error('Player not in game'));
      }

      const updatedTurn = yield* this.props.currentTurn.voteOnCard({
        playerId: opts.playerId,
        cardId: opts.cardId,
        ...(opts.deadlineConfig && { deadlineConfig: opts.deadlineConfig }),
      });

      const updatedScores = this.updateScores(updatedTurn);

      const entity = StartedGameEntity.create({
        ...this.props,
        currentTurn: updatedTurn,
        version: this.props.version + 1,
        scores: updatedScores,
      });

      return {
        entity,
        events: [
          VoteSubmitted({
            gameId: this.props.id,
            playerId: opts.playerId,
            wasAutoPlayed: opts.wasAutoPlayed,
          }),
        ],
      };
    });
  }

  notifyReadyForNextTurn(opts: {
    playerId: PlayerId;
    deadlineConfig?: { now: Date; timeoutMs: number };
  }): Effect.Effect<
    EntityWithEvents<GameEntity, TurnScoredEvent | GameEndedEvent>,
    Error
  > {
    if (!this.props.players.includes(opts.playerId)) {
      return Effect.fail(new Error('Player not in game'));
    }

    if (!this.props.currentTurn.isInScoringPhase()) {
      return Effect.fail(new Error('Game is not in scoring phase'));
    }

    // Idempotency check: if player already acknowledged, return unchanged
    if (this.props.playersReadyForNextTurn.includes(opts.playerId)) {
      return Effect.succeed({
        entity: this,
        events: [],
      });
    }

    const updatedPlayersReadyForNextTurn = Arr.append(
      this.props.playersReadyForNextTurn,
      opts.playerId,
    );

    // Clear acting player's deadline
    const turnWithClearedDeadline = opts.deadlineConfig
      ? this.props.currentTurn.clearPlayerDeadline(opts.playerId)
      : this.props.currentTurn;

    if (updatedPlayersReadyForNextTurn.length === this.props.players.length) {
      return this.transitionToNextTurnOrEndGame(
        turnWithClearedDeadline,
        opts.deadlineConfig,
      );
    }

    const entity = StartedGameEntity.create({
      ...this.props,
      currentTurn: turnWithClearedDeadline,
      playersReadyForNextTurn: updatedPlayersReadyForNextTurn,
      version: this.props.version + 1,
    });

    return Effect.succeed({
      entity,
      events: [],
    });
  }

  private transitionToNextTurnOrEndGame(
    currentTurn: TurnEntity,
    deadlineConfig?: { now: Date; timeoutMs: number },
  ): Effect.Effect<
    EntityWithEvents<GameEntity, TurnScoredEvent | GameEndedEvent>,
    never,
    never
  > {
    const currentStorytellerIndex = this.props.players.indexOf(
      currentTurn.currentStorytellerId,
    );
    const nextStorytellerId =
      this.props.players[
        (currentStorytellerIndex + 1) % this.props.players.length
      ];
    const updatedPlayersHavingBeenStoryteller = Object.fromEntries(
      Object.entries(this.props.playersHavingBeenStoryteller).map(
        ([playerId, numberOfTimes]) => [
          playerId,
          playerId === currentTurn.currentStorytellerId
            ? numberOfTimes + 1
            : numberOfTimes,
        ],
      ),
    );

    if (this.shouldGameEnd(updatedPlayersHavingBeenStoryteller)) {
      const entity = new EndedGameEntity({
        ...this.props,
        version: this.props.version + 1,
        scores: this.props.scores,
      });

      return Effect.succeed({
        entity,
        events: [GameEnded({ gameId: this.props.id })],
      });
    }

    let nextTurn = currentTurn.nextTurn({ nextStorytellerId });

    // Set deadline for new storyteller if deadlineConfig is provided
    if (deadlineConfig) {
      const deadline = new Date(
        deadlineConfig.now.getTime() + deadlineConfig.timeoutMs,
      );
      nextTurn = nextTurn.setPlayerDeadline(nextStorytellerId, deadline);
    }

    const entity = StartedGameEntity.create({
      ...this.props,
      playersReadyForNextTurn: [],
      currentTurn: nextTurn,
      version: this.props.version + 1,
      playersHavingBeenStoryteller: updatedPlayersHavingBeenStoryteller,
    });

    return Effect.succeed({
      entity,
      events: [TurnScored({ gameId: this.props.id })],
    });
  }

  private shouldGameEnd(
    updatedPlayersHavingBeenStoryteller: Record<string, number>,
  ): boolean {
    return $matchEndCondition(this.props.endCondition, {
      NumberOfTimesBeingStoryteller: (condition) => {
        return Object.values(updatedPlayersHavingBeenStoryteller).every(
          (times) => times >= condition.numberOfTimes,
        );
      },
      LimitOfPoints: (condition) => {
        return this.props.scores.some(({ score }) => score >= condition.limit);
      },
    });
  }

  private updateScores(updatedTurn: TurnEntity) {
    return this.props.scores.map(({ playerId, score }) => {
      return {
        playerId,
        score: score + updatedTurn.getEarnedPointsForPlayer(playerId),
      };
    });
  }
}

type EndedGameEntityProps = GameEntity['props'] & {
  scores: ReadonlyArray<{ playerId: PlayerId; score: number }>;
};

export class EndedGameEntity extends GameEntity {
  readonly status = EndedGameStatus();

  protected readonly props: EndedGameEntityProps;

  constructor(props: EndedGameEntityProps) {
    super(props);
    this.props = props;
  }

  protected createInstance(props: EndedGameEntityProps): this {
    return new EndedGameEntity(props) as this;
  }

  static fromSnapshot(
    snapshot: Omit<ReturnType<EndedGameEntity['toSnapshot']>, 'status'> & {
      scores: ReadonlyArray<{ playerId: PlayerId; score: number }>;
    },
  ) {
    return new EndedGameEntity({
      id: GameId(snapshot.id),
      createdBy: PlayerId(snapshot.createdBy),
      deckId: DeckId(snapshot.deckId),
      endCondition: endConditionFromSnapshot(snapshot.endCondition),
      players: snapshot.players.map((playerId) =>
        PlayerId(playerId),
      ) as unknown as NonEmptyReadonlyArray<PlayerId>,
      version: snapshot.version,
      scores: snapshot.scores,
    });
  }

  toSnapshot() {
    return {
      ...super.toSnapshot(),
      scores: this.props.scores,
    };
  }
}

export type NotStartedGameSnapshot = ReturnType<
  NotStartedGameEntity['toSnapshot']
>;
export type StartedGameSnapshot = ReturnType<StartedGameEntity['toSnapshot']>;
export type EndedGameSnapshot = ReturnType<EndedGameEntity['toSnapshot']>;
export type GameEntitySnapshot =
  | NotStartedGameSnapshot
  | StartedGameSnapshot
  | EndedGameSnapshot;

export const isNotStartedGameSnapshot = (
  snapshot: GameEntitySnapshot,
): snapshot is NotStartedGameSnapshot => {
  return snapshot.status._tag === 'NotStartedGame';
};

export const isStartedGameSnapshot = (
  snapshot: GameEntitySnapshot,
): snapshot is StartedGameSnapshot => {
  return snapshot.status._tag === 'StartedGame';
};

export const isEndedGame = (game: GameEntity): game is EndedGameEntity =>
  $is('EndedGame')(game.status);

export const isEndedGameSnapshot = (
  snapshot: GameEntitySnapshot,
): snapshot is EndedGameSnapshot => {
  return snapshot.status._tag === 'EndedGame';
};
