export class GameEntity {
	private constructor(
		readonly props: {
			readonly id: string;
			readonly createdBy: string;
			readonly deckId: string;
			readonly endCondition: {
				readonly type: 'number-of-times-being-storyteller';
				readonly numberOfTimes: number;
			};
		},
	) {}

	static create(props: {
		id: string;
		createdBy: string;
		deckId: string;
		endCondition: {
			type: 'number-of-times-being-storyteller';
			numberOfTimes: number;
		};
	}) {
		return new GameEntity(props);
	}
}
