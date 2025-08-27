import { Brand, Effect, Option } from "effect";
import { type Card, CardId } from "./deck.entity.js";
import { GameId, PlayerHand } from "./game.entity.js";
import { PlayerId } from "./player.entity.js";

export type TurnId = string & Brand.Brand<"TurnId">;

export const TurnId = Brand.nominal<TurnId>();

export class TurnEntity {
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
      readonly phase: "storytelling" | "selecting-cards";
      readonly playerHands: ReadonlyArray<PlayerHand>;
      readonly cardsInDrawPile: ReadonlyArray<Card>;
    },
  ) {}

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
    });
  }

  get id() {
    return this.props.id;
  }

  get playerHands() {
    return this.props.playerHands;
  }

  get cardsInDrawPile() {
    return this.props.cardsInDrawPile;
  }

  get phase() {
    return this.props.phase;
  }

  get startedAt() {
    return this.props.startedAt;
  }

  submitClue(opts: {
    playerId: PlayerId;
    clue: string;
    cardId: CardId;
  }): Effect.Effect<TurnEntity, Error, never> {
    console.log(this.props.playerHands);
    if (this.props.currentStorytellerId !== opts.playerId) {
      return Effect.fail(new Error("Only the storyteller can submit a clue"));
    }
    if (
      !this.props.playerHands.some((hand) =>
        hand.cards.some((card) => card.id === opts.cardId)
      )
    ) {
      return Effect.fail(
        new Error(
          "The storyteller cannot submit a clue on a card they don't have",
        ),
      );
    }

    return Effect.succeed(
      new TurnEntity({
        ...this.props,
        turnClue: Option.some({
          clue: opts.clue,
          cardId: opts.cardId,
        }),
        phase: "selecting-cards",
      }),
    );
  }
}
