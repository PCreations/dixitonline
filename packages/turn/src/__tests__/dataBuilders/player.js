import faker from 'faker';
import { buildTestHand } from './hand';
import { makePlayer } from '../../domain/player';

export const buildTestPlayer = () => {
  const defaultProperties = {
    id: faker.random.uuid(),
    name: faker.name.firstName(),
    hand: buildTestHand().build(),
  };
  const overrides = {};
  return {
    withHand(hand = defaultProperties.hand) {
      overrides.hand = hand;
      return this;
    },
    build() {
      return makePlayer({
        ...defaultProperties,
        ...overrides,
      });
    },
  };
};
