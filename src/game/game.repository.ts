import { Effect, Layer, Option } from 'effect';

export class GameRepository extends Effect.Tag('game/GameRepository')<
	GameRepository,
	{
		save: (props: {
			id: string;
			createdBy: string;
			deckId: string;
		}) => Effect.Effect<void>;
		findById: (
			id: string,
		) => Effect.Effect<
			Option.Option<{ id: string; createdBy: string; deckId: string }>
		>;
	}
>() {}

export const InMemoryGameRepository = Layer.effect(
	GameRepository,
	Effect.gen(function* () {
		const games = new Map<
			string,
			{ id: string; createdBy: string; deckId: string }
		>();

		return {
			save: (props: { id: string; createdBy: string; deckId: string }) =>
				Effect.gen(function* () {
					games.set(props.id, props);

					yield* Effect.succeed(void 0);
				}),
			findById: (id: string) =>
				Effect.succeed(Option.fromNullable(games.get(id))),
		};
	}),
);
