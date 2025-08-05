import { Effect, Layer, Option } from 'effect';
import { GameEntity } from './game.entity.js';

export class GameRepository extends Effect.Tag('game/GameRepository')<
	GameRepository,
	{
		save: (game: GameEntity) => Effect.Effect<void>;
		findById: (id: string) => Effect.Effect<Option.Option<GameEntity>>;
		isPlayerInGame: (
			gameId: string,
			playerId: string,
		) => Effect.Effect<boolean>;
	}
>() {}

export const InMemoryGameRepository = Layer.effect(
	GameRepository,
	Effect.gen(function* () {
		const games = new Map<string, GameEntity>();

		return {
			save: (game: GameEntity) =>
				Effect.gen(function* () {
					games.set(game.props.id, game);

					yield* Effect.succeed(void 0);
				}),
			findById: (id: string) =>
				Effect.succeed(Option.fromNullable(games.get(id))),
			isPlayerInGame: (gameId: string, playerId: string) =>
				Effect.succeed(true),
		};
	}),
);
