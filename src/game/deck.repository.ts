import { Effect, Layer, Option } from 'effect';
import { DeckEntity, DeckId } from './deck.entity.js';

export class DeckRepository extends Effect.Tag('game/DeckRepository')<
	DeckRepository,
	{
		save: (props: DeckEntity) => Effect.Effect<void>;
		getDefaultDeckId: () => Effect.Effect<Option.Option<DeckId>>;
	}
>() {}

export const InMemoryDeckRepository = Layer.effect(
	DeckRepository,
	Effect.gen(function* () {
		const decks = new Map<DeckId, DeckEntity>();
		let defaultDeckId: Option.Option<DeckId> = Option.none();

		return {
			save: (deck: DeckEntity) =>
				Effect.gen(function* () {
					decks.set(deck.props.id, deck);

					if (deck.props.isDefault) {
						defaultDeckId = Option.some(deck.props.id);
					}

					yield* Effect.succeed(void 0);
				}),
			getDefaultDeckId: () => Effect.succeed(defaultDeckId),
		};
	}),
);
