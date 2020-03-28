import faker from 'faker';
import { makeTurn } from '../../domain/turn';

export const buildTestTurn = () => {
  const defaultProperties = {
    id: faker.random.uuid(),
  };
  const overrides = {};
  return {
    withId(id = defaultProperties.id) {
      overrides.id = id;
      return this;
    },
    build() {
      return makeTurn({
        ...defaultProperties,
        ...overrides,
      });
    },
  };
};
