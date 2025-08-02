import { Brand, Data, Option } from 'effect';
import { DeckId } from './deck.entity.js';
import { PlayerId } from './player.entity.js';

export type GameId = string & Brand.Brand<'GameId'>;

export const GameId = Brand.nominal<GameId>();

export enum EndConditionType {
	NumberOfTimesBeingStoryteller = 'number-of-times-being-storyteller',
}

export type NumberOfTimesBeingStorytellerEndCondition = {
	readonly type: EndConditionType.NumberOfTimesBeingStoryteller;
	readonly numberOfTimes: number;
};

export class EndCondition extends Data.Class<NumberOfTimesBeingStorytellerEndCondition> {
	private static readonly DEFAULT_NUMBER_OF_TIMES_BEING_STORYTELLER = 3;

	private constructor(
		readonly props: NumberOfTimesBeingStorytellerEndCondition,
	) {
		super(props);
	}

	static createNumberOfTimesBeingStoryteller(props: {
		numberOfTimes: Option.Option<number>;
	}) {
		return new EndCondition({
			type: EndConditionType.NumberOfTimesBeingStoryteller,
			numberOfTimes: Option.getOrElse(
				props.numberOfTimes,
				() => EndCondition.DEFAULT_NUMBER_OF_TIMES_BEING_STORYTELLER,
			),
		});
	}

	toSnapshot() {
		return {
			type: this.props.type as string,
			numberOfTimes: this.props.numberOfTimes,
		};
	}
}

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
			endCondition: this.props.endCondition.toSnapshot(),
		};
	}
}
