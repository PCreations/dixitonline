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

export class DeckRepository extends Effect.Tag('game/DeckRepository')<
	DeckRepository,
	{
		save: (props: { id: string; isDefault: boolean }) => Effect.Effect<void>;
		getDefaultDeckId: () => Effect.Effect<Option.Option<string>>;
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

export class CreateGameUseCase extends Effect.Service<CreateGameUseCase>()(
	'game/CreateGameUseCase',
	{
		effect: Effect.gen(function* () {
			const gameRepository = yield* GameRepository;
			const deckRepository = yield* DeckRepository;

			return {
				createGame: (props: {
					gameId: string;
					playerId: string;
					deckId: Option.Option<string>;
				}) =>
					Effect.gen(function* () {
						const defaultDeckId = yield* deckRepository.getDefaultDeckId();

						yield* gameRepository.save({
							id: props.gameId,
							createdBy: props.playerId,
							deckId: Option.getOrElse(props.deckId, () =>
								Option.getOrThrow(defaultDeckId),
							),
						});
					}),
			};
		}),
		dependencies: [InMemoryGameRepository, InMemoryDeckRepository],
	},
) {}
