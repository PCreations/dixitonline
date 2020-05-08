import faker from 'faker';
import { buildTestHand } from './hand';

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
    withId(id = defaultProperties.id) {
      overrides.id = id;
      return this;
    },
    withName(name = defaultProperties.name) {
      overrides.name = name;
      return this;
    },
    build() {
      return {
        ...defaultProperties,
        ...overrides,
      };
    },
  };
};
