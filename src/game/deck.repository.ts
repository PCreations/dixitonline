import { Context, Effect, Layer, Option } from "effect";
import { DeckEntity, DeckId } from "./deck.entity.js";

export class DeckRepository extends Effect.Tag("game/DeckRepository")<
  DeckRepository,
  {
    save: (props: DeckEntity) => Effect.Effect<void>;
    getDefaultDeckId: () => Effect.Effect<Option.Option<DeckId>>;
    findById: (id: DeckId) => Effect.Effect<Option.Option<DeckEntity>>;
  }
>() {}

const makeInMemoryDeckRepository = (): Context.Tag.Service<DeckRepository> => {
  const decks = new Map<DeckId, DeckEntity>();
  let defaultDeckId: Option.Option<DeckId> = Option.some(DeckId("default"));

  return {
    save: (deck: DeckEntity) =>
      Effect.gen(function* () {
        decks.set(deck.props.id, deck);

        if (deck.props.isDefault) {
          defaultDeckId = Option.some(deck.props.id);
        }

        yield* Effect.succeed(void 0);
      }),
    findById: (id: DeckId) =>
      Effect.succeed(Option.fromNullable(decks.get(id))),
    getDefaultDeckId: () => Effect.succeed(defaultDeckId),
  };
};

export const InMemoryDeckRepository = Layer.sync(
  DeckRepository,
  makeInMemoryDeckRepository,
);
