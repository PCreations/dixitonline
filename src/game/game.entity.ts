import { Brand } from 'effect';
import { DeckId } from './deck.entity.js';

export type GameId = string & Brand.Brand<'GameId'>;

export const GameId = Brand.nominal<GameId>();

export class GameEntity {
	private constructor(
		readonly props: {
			readonly id: GameId;
			readonly createdBy: string;
			readonly deckId: DeckId;
			readonly endCondition: {
				readonly type: 'number-of-times-being-storyteller';
				readonly numberOfTimes: number;
			};
		},
	) {}

	static create(props: {
		id: GameId;
		createdBy: string;
		deckId: DeckId;
		endCondition: {
			type: 'number-of-times-being-storyteller';
			numberOfTimes: number;
		};
	}) {
		return new GameEntity(props);
	}
}
