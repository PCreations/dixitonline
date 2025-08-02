import { Brand } from 'effect';

export type DeckId = string & Brand.Brand<'DeckId'>;

export const DeckId = Brand.nominal<DeckId>();

export class DeckEntity {
	private constructor(
		readonly props: {
			readonly id: DeckId;
			readonly isDefault: boolean;
		},
	) {}

	static createDefault(props: { readonly id: DeckId }) {
		return new DeckEntity({
			id: DeckId(props.id),
			isDefault: true,
		});
	}

	static create(props: { readonly id: DeckId; readonly isDefault: boolean }) {
		return new DeckEntity(props);
	}
}
