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
		simulateStaleRead: (game: GameEntity) => Effect.Effect<void>;
	}
>() {}

export const InMemoryGameRepository = Layer.effect(
	GameRepository,
	Effect.gen(function* () {
		const games = new Map<string, GameEntity>();
		const staleReads = new Map<string, GameEntity>();

		return {
			save: (game: GameEntity) =>
				Effect.sync(() => games.set(game.props.id, game)),
			findById: (id: string) =>
				Effect.succeed(
					Option.fromNullable(staleReads.get(id) ?? games.get(id)),
				),
			isPlayerInGame: (gameId: string, playerId: string) =>
				Effect.succeed(true),
			simulateStaleRead: (game: GameEntity) =>
				Effect.sync(() => staleReads.set(game.props.id, game)),
		};
	}),
);
