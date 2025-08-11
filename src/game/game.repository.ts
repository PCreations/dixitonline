import { Data, Effect, Layer, Option, Context } from 'effect';
import { GameEntity } from './game.entity.js';

export class OptimisticConcurrencyError extends Data.TaggedError(
	'OptimisticConcurrencyError',
)<{}> {}

export class GameRepository extends Effect.Tag('game/GameRepository')<
	GameRepository,
	{
		save: (
			game: GameEntity
		) => Effect.Effect<void, OptimisticConcurrencyError>;
		findById: (id: string) => Effect.Effect<Option.Option<GameEntity>>;
		isPlayerInGame: (
			gameId: string,
			playerId: string,
		) => Effect.Effect<boolean>;
	}
>() {}

const makeInMemoryGameRepository = (): Context.Tag.Service<GameRepository> => {
	const games = new Map<string, GameEntity>();

	return {
		save: (game: GameEntity) =>
			Effect.gen(function* () {
				const maybeGame = Option.fromNullable(games.get(game.props.id));
				Option.map(maybeGame, (existingGame) => {
					if (game.toSnapshot().version !== existingGame.toSnapshot().version + 1) {
						return Effect.fail(new OptimisticConcurrencyError());
					}
					return Effect.succeed(void 0);
				})
				games.set(game.props.id, game);
			}),
		findById: (id: string) => {
			return Effect.gen(function* () {
				const game = games.get(id);
				return Option.fromNullable(game);
			});
		},
		isPlayerInGame: (gameId: string, playerId: string) => {
			return Effect.gen(function* () {
				const maybeGame = Option.fromNullable(games.get(gameId));
				if (Option.isNone(maybeGame)) {
					return false;
				}
				return maybeGame.value.toSnapshot().players.includes(playerId);
			});
		}
	};
};

export const InMemoryGameRepository = Layer.effect(
	GameRepository,
	Effect.succeed(makeInMemoryGameRepository()),
);
