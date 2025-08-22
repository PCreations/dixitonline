import { Brand, Option } from "effect";
import { type Card } from "./deck.entity.js";
import { type GameId, type PlayerHand } from "./game.entity.js";
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
      readonly turnClue: Option.Option<string>;
      readonly phase: "storytelling";
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
    turnStartedAt: Date;
  }) {
    return new TurnEntity({
      ...props,
      id: props.id,
      gameId: props.gameId,
      currentStorytellerId: props.currentStorytellerId,
      playerHands: props.playerHands,
      cardsInDrawPile: props.cardsInDrawPile,
      startedAt: props.turnStartedAt,
      turnClue: Option.none(),
      phase: "storytelling",
      turnNumber: 1,
    });
  }

  toSnapshot() {
    return {
      id: this.props.id,
      gameId: this.props.gameId,
      currentStorytellerId: this.props.currentStorytellerId,
      playerHands: this.props.playerHands.map((hand) => {
        return {
          playerId: hand.playerId,
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
}
