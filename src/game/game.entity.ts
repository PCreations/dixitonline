import { Array as Arr, Brand, Data, Effect, Option } from 'effect';
import { NonEmptyReadonlyArray } from 'effect/Array';
import { DeckId } from './deck.entity.js';
import { PlayerId } from './player.entity.js';

export type GameId = string & Brand.Brand<'GameId'>;

export const GameId = Brand.nominal<GameId>();

export enum EndConditionType {
	NumberOfTimesBeingStoryteller = 'number-of-times-being-storyteller',
	LimitOfPoints = 'limit-of-points',
}

const DEFAULT_NUMBER_OF_TIMES_BEING_STORYTELLER = 3;

export type NumberOfTimesBeingStorytellerEndCondition = {
	readonly numberOfTimes: number;
};

export type LimitOfPointsEndCondition = {
	readonly limit: number;
};

export type EndCondition = Data.TaggedEnum<{
	NumberOfTimesBeingStoryteller: NumberOfTimesBeingStorytellerEndCondition;
	LimitOfPoints: LimitOfPointsEndCondition;
}>;

const {
	$match: $matchEndCondition,
	NumberOfTimesBeingStoryteller: NumberOfTimesBeingStorytellerEndCondition,
	LimitOfPoints: LimitOfPointsEndCondition,
} = Data.taggedEnum<EndCondition>();

const endConditionToSnapshot = (endCondition: EndCondition) =>
	$matchEndCondition(endCondition, {
		NumberOfTimesBeingStoryteller: (endCondition) => ({
			type: endCondition._tag,
			numberOfTimes: endCondition.numberOfTimes,
		}),
		LimitOfPoints: (endCondition) => ({
			type: endCondition._tag,
			limit: endCondition.limit,
		}),
	});

const endConditionFromSnapshot = (
	snapshot: ReturnType<typeof endConditionToSnapshot>,
) => {
	return snapshot.type === 'NumberOfTimesBeingStoryteller'
		? NumberOfTimesBeingStorytellerEndCondition({
				numberOfTimes: snapshot.numberOfTimes,
			})
		: LimitOfPointsEndCondition({
				limit: snapshot.limit,
			});
};

export const createNumberOfTimesBeingStorytellerEndCondition = (props: {
	numberOfTimes: Option.Option<number>;
}) =>
	NumberOfTimesBeingStorytellerEndCondition({
		numberOfTimes: Option.getOrElse(
			props.numberOfTimes,
			() => DEFAULT_NUMBER_OF_TIMES_BEING_STORYTELLER,
		),
	});

export const createLimitOfPointsEndCondition = (props: { limit: number }) =>
	LimitOfPointsEndCondition({
		limit: props.limit,
	});

export const MAX_PLAYERS = 6;

export class GameEntity {
	private constructor(
		readonly props: {
			readonly id: GameId;
			readonly createdBy: PlayerId;
			readonly deckId: DeckId;
			readonly endCondition: EndCondition;
			readonly players: NonEmptyReadonlyArray<PlayerId>;
			readonly version: number;
		},
	) {}

	private static ensurePlayersIncludeCreator(
		players: ReadonlyArray<PlayerId>,
		createdBy: PlayerId,
	): NonEmptyReadonlyArray<PlayerId> {
		return Arr.isNonEmptyReadonlyArray(players) ? players : Arr.of(createdBy);
	}

	addPlayer(playerId: PlayerId): Effect.Effect<GameEntity, Error, never> {
		if (this.props.players.includes(playerId)) {
			return Effect.fail(new Error('Player already in game'));
		}

		if (this.props.players.length >= MAX_PLAYERS) {
			return Effect.fail(new Error('Game is full'));
		}

		const updatedPlayers = Arr.append(this.props.players, playerId);

		return Effect.succeed(
			new GameEntity({
				...this.props,
				players: updatedPlayers,
				version: this.props.version + 1,
			}),
		);
	}

	static create(props: {
		id: GameId;
		createdBy: PlayerId;
		deckId: DeckId;
		endCondition: EndCondition;
	}) {
		return new GameEntity({
			...props,
			players: GameEntity.ensurePlayersIncludeCreator([], props.createdBy),
			version: 1,
		});
	}

	toSnapshot() {
		return {
			id: this.props.id as string,
			createdBy: this.props.createdBy as string,
			deckId: this.props.deckId as string,
			endCondition: endConditionToSnapshot(this.props.endCondition),
			players: this.props.players as ReadonlyArray<string>,
			version: this.props.version,
		};
	}

	static fromSnapshot(snapshot: ReturnType<GameEntity['toSnapshot']>) {
		const createdBy = PlayerId(snapshot.createdBy);
		const playerIds = snapshot.players.map((playerId) => PlayerId(playerId));

		return new GameEntity({
			id: GameId(snapshot.id),
			createdBy,
			deckId: DeckId(snapshot.deckId),
			endCondition: endConditionFromSnapshot(snapshot.endCondition),
			players: GameEntity.ensurePlayersIncludeCreator(playerIds, createdBy),
			version: snapshot.version,
		});
	}
}
