import { Brand } from "effect";

export type DeckId = string & Brand.Brand<"DeckId">;

export const DeckId = Brand.nominal<DeckId>();

export type CardId = string & Brand.Brand<"CardId">;

export const CardId = Brand.nominal<CardId>();

export class Card {
  private constructor(
    private readonly props: { readonly id: CardId; readonly url: string },
  ) {}

  static create(props: { readonly id: CardId; readonly url: string }) {
    return new Card(props);
  }

  get id() {
    return this.props.id;
  }

  get url() {
    return this.props.url;
  }
}
export interface DeckShuffleStrategy {
  shuffle(cards: ReadonlyArray<Card>): ReadonlyArray<Card>;
}

export class DefaultDeckShuffleStrategy implements DeckShuffleStrategy {
  shuffle(cards: ReadonlyArray<Card>): ReadonlyArray<Card> {
    return cards;
  }
}

export class DeckEntity {
  private constructor(
    readonly props: {
      readonly id: DeckId;
      readonly isDefault: boolean;
      readonly cards: ReadonlyArray<Card>;
      readonly shuffleStrategy: DeckShuffleStrategy;
    },
  ) {}

  static createDefault(props: { readonly id: DeckId }) {
    return DeckEntity.create({
      ...props,
      isDefault: true,
    });
  }

  static create(
    props: {
      readonly id: DeckId;
      readonly isDefault: boolean;
      readonly cards?: ReadonlyArray<Card>;
    },
  ) {
    return new DeckEntity({
      ...props,
      cards: props.cards ?? [],
      shuffleStrategy: new DefaultDeckShuffleStrategy(),
    });
  }

  get id() {
    return this.props.id;
  }

  getShuffledCards() {
    return this.props.shuffleStrategy.shuffle(this.props.cards);
  }
}
