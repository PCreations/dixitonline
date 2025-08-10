import { expect } from '@effect/vitest';
import { Context, Effect, Layer, Option } from 'effect';
import { CreateGameUseCase } from '../create-game.usecase.js';
import { DeckEntity, DeckId } from '../deck.entity.js';
import { DeckRepository, InMemoryDeckRepository } from '../deck.repository.js';
import { GameEntity, MAX_PLAYERS } from '../game.entity.js';
import { GameRepository, InMemoryGameRepository } from '../game.repository.js';
import { JoinGameUseCase } from '../join-game.usecase.js';

type EndConditionDto =
	| {
			type: 'NumberOfTimesBeingStoryteller';
			numberOfTimes: number;
	  }
	| {
			type: 'LimitOfPoints';
			limit: number;
	  };

interface GameDriverDSL {
	readonly given: {
		readonly defaultDeck: (props: { id: string }) => Effect.Effect<void>;
		readonly existingDeck: (props: { id: string }) => Effect.Effect<void>;
		readonly existingGame: (props: {
			gameId: string;
			hostId: string;
			players?: ReadonlyArray<string>;
		}) => Effect.Effect<void>;
		readonly existingFullGame: (props: {
			gameId: string;
		}) => Effect.Effect<void>;
		readonly otherPlayerJustJoinedInBetween: (props: {
			gameId: string;
			playerId: string;
		}) => Effect.Effect<void>;
	};
	readonly useCases: {
		readonly createGame: (props: {
			gameId: string;
			hostId: string;
			deckId?: string;
			endCondition?: EndConditionDto;
		}) => Effect.Effect<void>;
		readonly joinGame: (props: {
			gameId: string;
			playerId: string;
		}) => Effect.Effect<void>;
	};
	readonly assert: {
		readonly createdGameToEqual: (game: {
			id: string;
			createdBy: string;
			deckId: string;
			endCondition?: EndConditionDto;
			players: ReadonlyArray<string>;
		}) => Effect.Effect<void, never, never>;
		readonly playerToHaveJoinedGame: (props: {
			gameId: string;
			playerId: string;
		}) => Effect.Effect<void, never, never>;
		readonly playerToNotHaveBeenAbleToJoinGame: (props?: {
			error?: string;
		}) => Effect.Effect<void, never, never>;
	};
}

export class GameDriver extends Context.Tag('GameDriver')<
	GameDriver,
	GameDriverDSL
>() {}

const makeUnitTestGameDriver = ({
	createGameUseCase,
	joinGameUseCase,
	gameRepository,
	deckRepository,
}: {
	createGameUseCase: CreateGameUseCase;
	joinGameUseCase: JoinGameUseCase;
	gameRepository: Context.Tag.Service<GameRepository>;
	deckRepository: Context.Tag.Service<DeckRepository>;
}): GameDriverDSL => {
	const testState = {
		currentError: Option.none<Error>(),
	};

	const given: GameDriverDSL['given'] = {
		defaultDeck: (props) =>
			deckRepository.save(DeckEntity.createDefault({ id: DeckId(props.id) })),
		existingDeck: (props) =>
			deckRepository.save(
				DeckEntity.create({ id: DeckId(props.id), isDefault: false }),
			),
		existingGame: (props) => {
			return Effect.gen(function* () {
				const defaultDeckId = DeckId('default-deck-id');
				yield* deckRepository.save(
					DeckEntity.create({ id: defaultDeckId, isDefault: true }),
				);
				yield* Effect.either(gameRepository.save(
					GameEntity.fromSnapshot({
						id: props.gameId,
						deckId: defaultDeckId,
						createdBy: props.hostId,
						endCondition: {
							type: 'NumberOfTimesBeingStoryteller',
							numberOfTimes: 3,
						},
						players: props.players ?? [],
						version: 1,
					}),
				));
			});
		},
		existingFullGame: (props) => {
			return Effect.gen(function* () {
				yield* given.existingGame({
					gameId: props.gameId,
					hostId: 'id-player-1',
					players: Array.from(
						{ length: MAX_PLAYERS },
						(_, i) => `id-player-${i + 1}`,
					),
				});
			});
		},
		otherPlayerJustJoinedInBetween: (props) => {
			return Effect.gen(function* () {
				const game = Option.getOrThrow(
					yield* gameRepository.findById(props.gameId),
				);

				const newGameEntity = GameEntity.fromSnapshot({
					...game.toSnapshot(),
					players: [...game.toSnapshot().players, props.playerId],
				});

				yield* Effect.either(gameRepository.save(newGameEntity));

				yield* gameRepository.simulateStaleRead(game);
			});
		},
	};

	return {
		given,
		useCases: {
			createGame: (props) =>
				createGameUseCase.createGame({
					gameId: props.gameId,
					hostId: props.hostId,
					deckId: Option.fromNullable(props.deckId),
					endCondition: Option.fromNullable(props.endCondition).pipe(
						Option.map((endCondition) =>
							endCondition.type === 'NumberOfTimesBeingStoryteller'
								? {
										type: 'NumberOfTimesBeingStoryteller',
										numberOfTimes: Option.some(endCondition.numberOfTimes),
									}
								: {
										type: 'LimitOfPoints',
										limit: endCondition.limit,
									},
						),
					),
				}),
			joinGame: (props) =>
				joinGameUseCase
					.joinGame({
						gameId: props.gameId,
						playerId: props.playerId,
					})
					.pipe(
						Effect.catchAll((error) => {
							testState.currentError = Option.some(error);
							return Effect.succeed(void 0);
						}),
					),
		},
		assert: {
			createdGameToEqual: (game) =>
				Effect.gen(function* () {
					const createdGame = yield* gameRepository.findById(game.id);

					const defaultEndCondition = {
						type: 'NumberOfTimesBeingStoryteller',
						numberOfTimes: 3,
					};

					Option.map(createdGame, (gameEntity) =>
						expect(gameEntity.toSnapshot()).toEqual({
							id: game.id,
							createdBy: game.createdBy,
							deckId: game.deckId,
							endCondition: game.endCondition ?? defaultEndCondition,
							players: game.players,
							version: 1,
						}),
					);
				}),
			playerToHaveJoinedGame: (props) =>
				Effect.gen(function* () {
					const isPlayerInGame = yield* gameRepository.isPlayerInGame(
						props.gameId,
						props.playerId,
					);
					expect(isPlayerInGame).toBe(true);
				}),
			playerToNotHaveBeenAbleToJoinGame: (props) =>
				Effect.sync(() => {
					expect(testState.currentError).toEqual(
						Option.some(new Error(props?.error)),
					);
				}),
		},
	};
};

export const GameDriverUnitTestLayer = Layer.effect(
	GameDriver,
	Effect.gen(function* () {
		const createGameUseCase = yield* CreateGameUseCase;
		const joinGameUseCase = yield* JoinGameUseCase;
		const gameRepository = yield* GameRepository;
		const deckRepository = yield* DeckRepository;

		return makeUnitTestGameDriver({
			createGameUseCase,
			joinGameUseCase,
			gameRepository,
			deckRepository,
		});
	}),
).pipe(
	Layer.provide(
		Layer.mergeAll(
			InMemoryGameRepository,
			InMemoryDeckRepository,
			CreateGameUseCase.Default,
			JoinGameUseCase.Default,
		),
	),
);
