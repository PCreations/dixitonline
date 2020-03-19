import faker from 'faker';
import { makeGame } from '../../domain/game';

export const buildTestGame = () => {
  const defaultProperties = {
    id: faker.random.uuid(),
  };
  return {
    withId(id) {
      defaultProperties.id = id;
      return this;
    },
    build() {
      return makeGame(defaultProperties);
    },
  };
};
