import { Array as Arr, Brand, Effect, Option } from "effect";
import { Card, CardId } from "./deck.entity.js";
import { GameId, PlayerHand } from "./game.entity.js";
import { GameRules, GameRulesFactory, ScoreReason } from "./game-rules.js";
import { PlayerId } from "./player.entity.js";

export type TurnId = string & Brand.Brand<"TurnId">;

export const TurnId = Brand.nominal<TurnId>();

export class TurnEntity {
  private readonly rules: GameRules;

  private constructor(
    private readonly props: {
      readonly id: TurnId;
      readonly gameId: GameId;
      readonly currentStorytellerId: PlayerId;
      readonly turnNumber: number;
      readonly startedAt: Date;
      readonly turnClue: Option.Option<{
        clue: string;
        cardId: CardId;
      }>;
      readonly phase: "storytelling" | "selecting-cards" | "voting" | "scoring";
      readonly playerHands: ReadonlyArray<PlayerHand>;
      readonly cardsInDrawPile: ReadonlyArray<Card>;
      readonly selectedCards: ReadonlyArray<{
        cardId: CardId;
        playerId: PlayerId;
      }>;
      readonly votedCards: ReadonlyArray<{
        cardId: CardId;
        ownedBy: PlayerId;
        votedBy: PlayerId;
      }>;
      readonly pointsByPlayer: Map<
        PlayerId,
        ReadonlyArray<
          { points: number; reason: ScoreReason }
        >
      >;
    },
  ) {
    this.rules = GameRulesFactory.createForPlayersCount(
      props.playerHands.length,
    );
  }

  static create(props: {
    id: TurnId;
    gameId: GameId;
    currentStorytellerId: PlayerId;
    playerHands: ReadonlyArray<PlayerHand>;
    cardsInDrawPile: ReadonlyArray<Card>;
    startedAt: Date;
  }) {
    return new TurnEntity({
      ...props,
      id: props.id,
      gameId: props.gameId,
      currentStorytellerId: props.currentStorytellerId,
      playerHands: props.playerHands,
      cardsInDrawPile: props.cardsInDrawPile,
      startedAt: props.startedAt,
      turnClue: Option.none(),
      phase: "storytelling",
      turnNumber: 1,
      selectedCards: [],
      votedCards: [],
      pointsByPlayer: new Map(props.playerHands.map((hand) => [
        hand.playerId,
        [] as ReadonlyArray<{ points: number; reason: ScoreReason }>,
      ])),
    });
  }

  toSnapshot() {
    return {
      id: this.props.id as string,
      gameId: this.props.gameId as string,
      currentStorytellerId: this.props.currentStorytellerId as string,
      playerHands: this.props.playerHands.map((hand) => {
        return {
          playerId: hand.playerId as string,
          cards: hand.cards,
        };
      }),
      cardsInDrawPile: this.props.cardsInDrawPile,
      phase: this.props.phase,
      turnNumber: this.props.turnNumber,
      turnClue: this.props.turnClue,
      startedAt: this.props.startedAt,
      selectedCards: this.props.selectedCards,
      votedCards: this.props.votedCards,
      pointsByPlayer: this.props.pointsByPlayer,
    };
  }

  static fromSnapshot(snapshot: ReturnType<TurnEntity["toSnapshot"]>) {
    return new TurnEntity({
      id: TurnId(snapshot.id),
      gameId: GameId(snapshot.gameId),
      currentStorytellerId: PlayerId(snapshot.currentStorytellerId),
      playerHands: snapshot.playerHands.map((hand) => {
        return PlayerHand.create({
          playerId: PlayerId(hand.playerId),
          cards: hand.cards,
        });
      }),
      cardsInDrawPile: snapshot.cardsInDrawPile,
      phase: snapshot.phase,
      turnNumber: snapshot.turnNumber,
      turnClue: snapshot.turnClue,
      startedAt: snapshot.startedAt,
      selectedCards: snapshot.selectedCards,
      votedCards: snapshot.votedCards,
      pointsByPlayer: new Map(snapshot.pointsByPlayer),
    });
  }

  get playerHands() {
    return this.props.playerHands;
  }

  get currentStorytellerId() {
    return this.props.currentStorytellerId;
  }

  nextTurn(opts: { nextStorytellerId: PlayerId }) {
    let cardsInDrawPile = this.props.cardsInDrawPile;
    const updatedPlayerHands: Array<PlayerHand> = [];

    for (const hand of this.props.playerHands) {
      const result = hand.completeFromDrawPile(
        cardsInDrawPile,
        this.rules.getNumberOfCardsInHand(),
      );
      updatedPlayerHands.push(result[0]);
      cardsInDrawPile = result[1];
    }

    return new TurnEntity({
      gameId: this.props.gameId,
      id: TurnId(`${this.props.gameId}-${this.props.turnNumber + 1}`),
      startedAt: new Date(),
      cardsInDrawPile,
      playerHands: updatedPlayerHands,
      turnNumber: this.props.turnNumber + 1,
      turnClue: Option.none(),
      selectedCards: [],
      votedCards: [],
      pointsByPlayer: new Map(updatedPlayerHands.map((hand) => [
        hand.playerId,
        [] as ReadonlyArray<{ points: number; reason: ScoreReason }>,
      ])),
      phase: "storytelling",
      currentStorytellerId: opts.nextStorytellerId,
    });
  }

  isInScoringPhase() {
    return this.props.phase === "scoring";
  }

  submitClue(opts: {
    playerId: PlayerId;
    clue: string;
    cardId: CardId;
  }): Effect.Effect<TurnEntity, Error, never> {
    if (this.props.currentStorytellerId !== opts.playerId) {
      return Effect.fail(new Error("Only the storyteller can submit a clue"));
    }
    if (
      !this.doesPlayerOwnCard({
        playerId: opts.playerId,
        cardId: opts.cardId,
      })
    ) {
      return Effect.fail(
        new Error(
          "The storyteller cannot submit a clue on a card they don't have",
        ),
      );
    }

    return Effect.gen(this, function* () {
      const updatedTurn = yield* this.removeCardFromPlayerHand(opts);
      return new TurnEntity({
        ...updatedTurn.props,
        turnClue: Option.some({
          clue: opts.clue,
          cardId: opts.cardId,
        }),
        phase: "selecting-cards",
      });
    });
  }

  selectCard(opts: {
    playerId: PlayerId;
    cardId: CardId;
  }): Effect.Effect<TurnEntity, Error, never> {
    return Effect.gen(this, function* () {
      yield* this.guardAgainstStorytellerSelectingCard(opts);
      yield* this.guardAgainstCardNotInPlayerHand(opts);
      yield* this.guardAgainstPlayerSelectingMoreCardsThanAllowed(opts);

      const updatedTurn = yield* this.removeCardFromPlayerHand(opts);

      const updatedSelectedCards = [
        ...this.props.selectedCards,
        {
          cardId: opts.cardId,
          playerId: opts.playerId,
        },
      ];

      return new TurnEntity({
        ...this.props,
        playerHands: updatedTurn.playerHands,
        selectedCards: updatedSelectedCards,
        phase: this.rules.isVotingPhase(
            updatedSelectedCards.length,
            this.props.playerHands.length,
          )
          ? "voting"
          : "selecting-cards",
      });
    });
  }

  voteOnCard(opts: {
    playerId: PlayerId;
    cardId: CardId;
  }): Effect.Effect<TurnEntity, Error, never> {
    return Effect.gen(this, function* () {
      const availableCardsToVoteOn = yield* this.getAvailableCardsToVoteOn();
      yield* this.validateVote(opts, availableCardsToVoteOn);
      const card = yield* this.getCardToVoteOn(opts, availableCardsToVoteOn);
      const votedCards = this.addVoteToCards(opts, card);
      const nextPhase = this.determineNextPhase(votedCards);
      const updatedPointsByPlayer = yield* this.computePointsIfNeeded(
        nextPhase,
        votedCards,
      );

      return new TurnEntity({
        ...this.props,
        votedCards,
        pointsByPlayer: updatedPointsByPlayer,
        phase: nextPhase,
      });
    });
  }

  getEarnedPointsForPlayer(playerId: PlayerId) {
    return this.props.pointsByPlayer.get(playerId)?.reduce(
      (acc, curr) => acc + curr.points,
      0,
    ) ?? 0;
  }

  private guardAgainstStorytellerSelectingCard(opts: {
    playerId: PlayerId;
    cardId: CardId;
  }): Effect.Effect<void, Error, never> {
    if (this.props.currentStorytellerId === opts.playerId) {
      return Effect.fail(new Error("The storyteller cannot select a card"));
    }
    return Effect.void;
  }

  private guardAgainstCardNotInPlayerHand(opts: {
    playerId: PlayerId;
    cardId: CardId;
  }): Effect.Effect<void, Error, never> {
    if (!this.doesPlayerOwnCard(opts)) {
      return Effect.fail(new Error("The card is not in the player's hand"));
    }
    return Effect.void;
  }

  private guardAgainstPlayerSelectingMoreCardsThanAllowed(opts: {
    playerId: PlayerId;
    cardId: CardId;
  }): Effect.Effect<void, Error, never> {
    return this.rules.canPlayerSelectMoreCards(
      this.props.selectedCards,
      opts.playerId,
    );
  }

  private removeCardFromPlayerHand(opts: {
    playerId: PlayerId;
    cardId: CardId;
  }): Effect.Effect<TurnEntity, Error, never> {
    const hand = this.props.playerHands.find(
      (hand) => hand.playerId === opts.playerId,
    );
    if (!hand) {
      return Effect.fail(new Error("Player hand not found"));
    }
    const self = this;
    return Effect.map(
      hand.removeCard(opts.cardId),
      (newHand) =>
        new TurnEntity({
          ...self.props,
          playerHands: self.props.playerHands.map((h) =>
            h.playerId === opts.playerId ? newHand : h
          ),
        }),
    );
  }

  private doesPlayerOwnCard(opts: { playerId: PlayerId; cardId: CardId }) {
    const playerHand = this.props.playerHands.find(
      (hand) => hand.playerId === opts.playerId,
    );
    if (!playerHand) {
      return false;
    }
    return playerHand.isCardInHand(opts.cardId);
  }

  private guardAgainstCardNotAvailableForVoting(
    opts: { playerId: PlayerId; cardId: CardId },
    availableCardsToVoteOn: ReadonlyArray<{
      cardId: CardId;
      playerId: PlayerId;
    }>,
  ): Effect.Effect<void, Error, never> {
    const card = availableCardsToVoteOn.find(
      (card) => card.cardId === opts.cardId,
    );

    if (card === undefined) {
      return Effect.fail(
        new Error("The card is not in the cards you can vote on"),
      );
    }

    return Effect.void;
  }

  private getCardToVoteOn(
    opts: { playerId: PlayerId; cardId: CardId },
    availableCardsToVoteOn: ReadonlyArray<{
      cardId: CardId;
      playerId: PlayerId;
    }>,
  ): Effect.Effect<{ cardId: CardId; playerId: PlayerId }, Error, never> {
    const card = availableCardsToVoteOn.find(
      (card) => card.cardId === opts.cardId,
    );

    if (card === undefined) {
      return Effect.fail(
        new Error("The card is not in the cards you can vote on"),
      );
    }

    return Effect.succeed(card);
  }

  private guardAgainstPlayerVotingOnOwnCard(
    opts: { playerId: PlayerId; cardId: CardId },
    card: { cardId: CardId; playerId: PlayerId },
  ): Effect.Effect<void, Error, never> {
    if (card.playerId === opts.playerId) {
      return Effect.fail(new Error("The player cannot vote on their own card"));
    }

    return Effect.void;
  }

  private getAvailableCardsToVoteOn(): Effect.Effect<
    ReadonlyArray<{ cardId: CardId; playerId: PlayerId }>,
    Error,
    never
  > {
    return Effect.gen(this, function* () {
      const storytellerCard = Option.getOrThrowWith(
        this.props.turnClue,
        () => new Error("The storyteller has not submitted a clue"),
      );

      return this.props.selectedCards.concat({
        cardId: storytellerCard.cardId,
        playerId: this.props.currentStorytellerId,
      });
    });
  }

  private validateVote(
    opts: { playerId: PlayerId; cardId: CardId },
    availableCardsToVoteOn: ReadonlyArray<
      { cardId: CardId; playerId: PlayerId }
    >,
  ): Effect.Effect<void, Error, never> {
    return Effect.gen(this, function* () {
      yield* this.guardAgainstPlayerVotingMoreThanOnce(opts);
      yield* this.guardAgainstCardNotAvailableForVoting(
        opts,
        availableCardsToVoteOn,
      );
      const card = yield* this.getCardToVoteOn(opts, availableCardsToVoteOn);
      yield* this.guardAgainstPlayerVotingOnOwnCard(opts, card);
    });
  }

  private addVoteToCards(
    opts: { playerId: PlayerId; cardId: CardId },
    card: { cardId: CardId; playerId: PlayerId },
  ): ReadonlyArray<{ cardId: CardId; ownedBy: PlayerId; votedBy: PlayerId }> {
    return [
      ...this.props.votedCards,
      {
        cardId: opts.cardId,
        ownedBy: card.playerId,
        votedBy: opts.playerId,
      },
    ];
  }

  private determineNextPhase(
    votedCards: ReadonlyArray<
      { cardId: CardId; ownedBy: PlayerId; votedBy: PlayerId }
    >,
  ): "scoring" | "voting" {
    return this.rules.isScoringPhase(
        votedCards.length,
        this.props.playerHands.length,
      )
      ? "scoring"
      : "voting";
  }

  private computePointsIfNeeded(
    nextPhase: "scoring" | "voting",
    votedCards: ReadonlyArray<
      { cardId: CardId; ownedBy: PlayerId; votedBy: PlayerId }
    >,
  ): Effect.Effect<
    Map<PlayerId, ReadonlyArray<{ points: number; reason: ScoreReason }>>,
    Error,
    never
  > {
    if (nextPhase !== "scoring") {
      return Effect.succeed(this.props.pointsByPlayer);
    }

    return Effect.gen(this, function* () {
      const allAvailableCards = yield* this.getAllAvailableCards();
      const votes = this.transformVotesToScoreFormat(
        votedCards,
        allAvailableCards,
      );
      const playerScores = this.rules.computeScore({
        storytellerId: this.props.currentStorytellerId,
        votes,
      });

      return this.updatePointsByPlayer(playerScores);
    });
  }

  private getAllAvailableCards(): Effect.Effect<
    ReadonlyArray<{ cardId: CardId; playerId: PlayerId }>,
    Error,
    never
  > {
    return Effect.succeed([
      ...this.props.selectedCards,
      ...(Option.isSome(this.props.turnClue)
        ? [{
          cardId: this.props.turnClue.value.cardId,
          playerId: this.props.currentStorytellerId,
        }]
        : []),
    ]);
  }

  private transformVotesToScoreFormat(
    votedCards: ReadonlyArray<
      { cardId: CardId; ownedBy: PlayerId; votedBy: PlayerId }
    >,
    allAvailableCards: ReadonlyArray<{ cardId: CardId; playerId: PlayerId }>,
  ): ReadonlyArray<
    { cardId: CardId; ownedBy: PlayerId; votes: ReadonlyArray<PlayerId> }
  > {
    const votesGroupedByCard = Arr.groupBy(
      votedCards,
      (vote) => vote.cardId,
    );

    return allAvailableCards.map((card) => ({
      cardId: card.cardId,
      ownedBy: card.playerId,
      votes: votesGroupedByCard[card.cardId]?.map((vote) => vote.votedBy) ?? [],
    }));
  }

  private updatePointsByPlayer(
    playerScores: ReadonlyArray<{
      playerId: PlayerId;
      points: ReadonlyArray<{ value: number; reason: ScoreReason }>;
    }>,
  ): Map<PlayerId, ReadonlyArray<{ points: number; reason: ScoreReason }>> {
    const updatedPointsByPlayer = new Map(this.props.pointsByPlayer);
    for (const playerScore of playerScores) {
      updatedPointsByPlayer.set(
        playerScore.playerId,
        playerScore.points.map((p) => ({
          points: p.value,
          reason: p.reason,
        })),
      );
    }
    return updatedPointsByPlayer;
  }

  private guardAgainstPlayerVotingMoreThanOnce(
    opts: { playerId: PlayerId; cardId: CardId },
  ): Effect.Effect<void, Error, never> {
    const hasPlayerVoted = this.props.votedCards.some(
      (vote) => vote.votedBy === opts.playerId,
    );

    if (hasPlayerVoted) {
      return Effect.fail(new Error("The player cannot vote more than once"));
    }

    return Effect.void;
  }
}
