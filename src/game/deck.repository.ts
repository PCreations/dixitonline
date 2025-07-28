import { Effect, Layer, Option } from 'effect';

export class DeckRepository extends Effect.Tag('game/DeckRepository')<
	DeckRepository,
	{
		save: (props: { id: string; isDefault: boolean }) => Effect.Effect<void>;
		getDefaultDeckId: () => Effect.Effect<Option.Option<string>>;
	}
>() {}

export const InMemoryDeckRepository = Layer.effect(
	DeckRepository,
	Effect.gen(function* () {
		const decks = new Map<string, { id: string; isDefault: boolean }>();
		let defaultDeckId: Option.Option<string> = Option.none();

		return {
			save: (props: { id: string; isDefault: boolean }) =>
				Effect.gen(function* () {
					decks.set(props.id, props);

					if (props.isDefault) {
						defaultDeckId = Option.some(props.id);
					}

					yield* Effect.succeed(void 0);
				}),
			getDefaultDeckId: () => Effect.succeed(defaultDeckId),
		};
	}),
);
