import faker from 'faker';
import { makeCard } from '../../domain/card';

export const buildTestCard = () => {
  const defaultProperties = {
    id: faker.random.uuid(),
    url: faker.image.imageUrl(),
  };
  const overrides = {};
  return {
    build() {
      return makeCard({
        ...defaultProperties,
        ...overrides,
      });
    },
  };
};
