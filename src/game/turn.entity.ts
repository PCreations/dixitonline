import { Brand, Effect, Option } from 'effect';
import { type Card, CardId } from './deck.entity.js';
import { GameId, PlayerHand } from './game.entity.js';
import { GameRules, GameRulesFactory } from './game-rules.js';
import { PlayerId } from './player.entity.js';

export type TurnId = string & Brand.Brand<'TurnId'>;

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
      readonly phase: 'storytelling' | 'selecting-cards' | 'voting';
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
    },
  ) {
    this.rules = GameRulesFactory.create(props.playerHands.length);
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
      phase: 'storytelling',
      turnNumber: 1,
      selectedCards: [],
      votedCards: [],
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
    };
  }

  static fromSnapshot(snapshot: ReturnType<TurnEntity['toSnapshot']>) {
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
    });
  }

  get playerHands() {
    return this.props.playerHands;
  }

  submitClue(opts: {
    playerId: PlayerId;
    clue: string;
    cardId: CardId;
  }): Effect.Effect<TurnEntity, Error, never> {
    if (this.props.currentStorytellerId !== opts.playerId) {
      return Effect.fail(new Error('Only the storyteller can submit a clue'));
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
        phase: 'selecting-cards',
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
          ? 'voting'
          : 'selecting-cards',
      });
    });
  }

  voteOnCard(opts: {
    playerId: PlayerId;
    cardId: CardId;
  }): Effect.Effect<TurnEntity, Error, never> {
    return Effect.gen(this, function* () {
      const availableCardsToVoteOn = this.props.selectedCards.concat({
        cardId: Option.getOrThrowWith(
          this.props.turnClue,
          () => new Error('The storyteller has not submitted a clue'),
        ).cardId,
        playerId: this.props.currentStorytellerId,
      });

      yield* this.guardAgainstPlayerVotingMoreThanOnce(opts);
      yield* this.guardAgainstCardNotAvailableForVoting(
        opts,
        availableCardsToVoteOn,
      );
      const card = yield* this.getCardToVoteOn(opts, availableCardsToVoteOn);
      yield* this.guardAgainstPlayerVotingOnOwnCard(opts, card);

      return new TurnEntity({
        ...this.props,
        votedCards: [
          ...this.props.votedCards,
          {
            cardId: opts.cardId,
            ownedBy: card.playerId,
            votedBy: opts.playerId,
          },
        ],
      });
    });
  }

  private guardAgainstStorytellerSelectingCard(opts: {
    playerId: PlayerId;
    cardId: CardId;
  }): Effect.Effect<void, Error, never> {
    if (this.props.currentStorytellerId === opts.playerId) {
      return Effect.fail(new Error('The storyteller cannot select a card'));
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
      return Effect.fail(new Error('Player hand not found'));
    }
    const self = this;
    return Effect.map(
      hand.removeCard(opts.cardId),
      (newHand) =>
        new TurnEntity({
          ...self.props,
          playerHands: self.props.playerHands.map((h) =>
            h.playerId === opts.playerId ? newHand : h,
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
        new Error('The card is not in the cards you can vote on'),
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
        new Error('The card is not in the cards you can vote on'),
      );
    }

    return Effect.succeed(card);
  }

  private guardAgainstPlayerVotingOnOwnCard(
    opts: { playerId: PlayerId; cardId: CardId },
    card: { cardId: CardId; playerId: PlayerId },
  ): Effect.Effect<void, Error, never> {
    if (card.playerId === opts.playerId) {
      return Effect.fail(new Error('The player cannot vote on their own card'));
    }

    return Effect.void;
  }

  private guardAgainstPlayerVotingMoreThanOnce(
    opts: { playerId: PlayerId; cardId: CardId },
  ): Effect.Effect<void, Error, never> {
    const hasPlayerVoted = this.props.votedCards.some(
      (vote) => vote.votedBy === opts.playerId,
    );

    if (hasPlayerVoted) {
      return Effect.fail(new Error('The player cannot vote more than once'));
    }

    return Effect.void;
  }
}
