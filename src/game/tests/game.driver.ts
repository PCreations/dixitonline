import { expect } from '@effect/vitest';
import { Context, Effect, Layer, Option } from 'effect';
import { CreateGameUseCase } from '../create-game.usecase.js';
import { DeckEntity, DeckId } from '../deck.entity.js';
import { DeckRepository, InMemoryDeckRepository } from '../deck.repository.js';
import { GameRepository, InMemoryGameRepository } from '../game.repository.js';

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
	};
	readonly useCases: {
		readonly createGame: (props: {
			gameId: string;
			hostId: string;
			deckId?: string;
			endCondition?: EndConditionDto;
		}) => Effect.Effect<void>;
	};
	readonly assert: {
		readonly createdGameToEqual: (game: {
			id: string;
			createdBy: string;
			deckId: string;
			endCondition?: EndConditionDto;
		}) => Effect.Effect<void, never, never>;
	};
}

export class GameDriver extends Context.Tag('GameDriver')<
	GameDriver,
	GameDriverDSL
>() {}

const makeUnitTestGameDriver = ({
	createGameUseCase,
	gameRepository,
	deckRepository,
}: {
	createGameUseCase: CreateGameUseCase;
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
		},
	};
};

export const GameDriverUnitTestLayer = Layer.effect(
	GameDriver,
	Effect.gen(function* () {
		const createGameUseCase = yield* CreateGameUseCase;
		const gameRepository = yield* GameRepository;
		const deckRepository = yield* DeckRepository;

		return makeUnitTestGameDriver({
			createGameUseCase,
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
		),
	),
);
