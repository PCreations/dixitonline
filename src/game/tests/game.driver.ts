import { expect } from '@effect/vitest';
import { Context, Effect, Layer, Option } from 'effect';
import { CreateGameUseCase } from '../create-game.usecase.js';
import { DeckEntity, DeckId } from '../deck.entity.js';
import { DeckRepository, InMemoryDeckRepository } from '../deck.repository.js';
import {
	createNumberOfTimesBeingStorytellerEndCondition,
	GameEntity,
	GameId,
} from '../game.entity.js';
import { GameRepository, InMemoryGameRepository } from '../game.repository.js';
import { JoinGameUseCase } from '../join-game.usecase.js';
import { PlayerId } from '../player.entity.js';

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
		}) => Effect.Effect<void, never, never>;
		readonly playerToHaveJoinedGame: (props: {
			gameId: string;
			playerId: string;
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
	return {
		given: {
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
					yield* gameRepository.save(
						GameEntity.create({
							id: GameId(props.gameId),
							deckId: defaultDeckId,
							createdBy: PlayerId(props.hostId),
							endCondition: createNumberOfTimesBeingStorytellerEndCondition({
								numberOfTimes: Option.none(),
							}),
						}),
					);
				});
			},
		},
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
				joinGameUseCase.joinGame({
					gameId: props.gameId,
					playerId: props.playerId,
				}),
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
