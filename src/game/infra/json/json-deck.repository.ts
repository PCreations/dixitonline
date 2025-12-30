import { Effect, Layer, Option } from 'effect';
import defaultDeckConfig from '../../data/default-deck.json' with {
  type: 'json',
};
import { Card, CardId, DeckEntity, DeckId } from '../../deck.entity.js';
import { DeckRepository } from '../../deck.repository.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:44321';

const buildCardUrl = (
  storagePath: string,
  cardNumber: number,
  pattern: string,
) => {
  const filename = pattern.replace('{n}', String(cardNumber));
  return `${SUPABASE_URL}/storage/v1/object/public/${storagePath}/${filename}`;
};

interface DeckConfig {
  id: string;
  name: string;
  totalCards: number;
  cardPattern: string;
  storagePath: string;
}

const createDeckFromConfig = (config: DeckConfig): DeckEntity => {
  const cards = Array.from({ length: config.totalCards }, (_, i) => {
    const cardNumber = i + 1;
    return Card.create({
      id: CardId(`card_${cardNumber}`),
      url: buildCardUrl(config.storagePath, cardNumber, config.cardPattern),
    });
  });

  return DeckEntity.createDefault({
    id: DeckId(config.id),
    cards,
  });
};

export const JsonDeckRepository = Layer.sync(DeckRepository, () => {
  const defaultDeck = createDeckFromConfig(defaultDeckConfig as DeckConfig);
  const decks = new Map<string, DeckEntity>([[defaultDeck.id, defaultDeck]]);

  return {
    save: (deck: DeckEntity) =>
      Effect.gen(function* () {
        decks.set(deck.id, deck);
        yield* Effect.succeed(void 0);
      }),
    getDefaultDeckId: () => Effect.succeed(Option.some(defaultDeck.id)),
    findById: (id: DeckId) =>
      Effect.succeed(Option.fromNullable(decks.get(id))),
  };
});
