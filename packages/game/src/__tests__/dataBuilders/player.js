import faker from 'faker';
import { makePlayer } from '../../domain/player';

export const buildTestPlayer = () => {
  const defaultProperties = {
    id: faker.random.uuid(),
    name: faker.name.firstName(),
  };
  const properties = {};
  return {
    withId(id = defaultProperties.id) {
      properties.id = id;
      return this;
    },
    withName(name = defaultProperties.name) {
      properties.name = name;
      return this;
    },
    build() {
      return makePlayer({
        ...defaultProperties,
        ...properties,
      });
    },
  };
};
