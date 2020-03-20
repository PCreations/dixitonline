import faker from 'faker';
import { buildTestPlayer } from './player';
import { makeGame } from '../../domain/game';

export const buildTestGame = () => {
  const defaultProperties = {
    id: faker.random.uuid(),
    host: buildTestPlayer().build(),
  };
  const overrides = {};
  return {
    withId(id = defaultProperties.id) {
      overrides.id = id;
      return this;
    },
    withHost(host = defaultProperties.host) {
      overrides.host = host;
      return this;
    },
    build() {
      return makeGame({
        ...defaultProperties,
        ...overrides,
      });
    },
  };
};
