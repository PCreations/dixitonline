import { Brand, Data, Option } from 'effect';
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

export class GameEntity {
	private constructor(
		readonly props: {
			readonly id: GameId;
			readonly createdBy: PlayerId;
			readonly deckId: DeckId;
			readonly endCondition: EndCondition;
		},
	) {}

	static create(props: {
		id: GameId;
		createdBy: PlayerId;
		deckId: DeckId;
		endCondition: EndCondition;
	}) {
		return new GameEntity(props);
	}

	toSnapshot() {
		return {
			id: this.props.id as string,
			createdBy: this.props.createdBy,
			deckId: this.props.deckId as string,
			endCondition: endConditionToSnapshot(this.props.endCondition),
		};
	}
}
