import faker from 'faker';
import { makePlayer } from '../../domain/player';

export const buildTestPlayer = () => {
  const defaultProperties = {
    id: faker.random.uuid(),
    name: faker.name.firstName(),
    heartbeat: new Date('2021-04-04'),
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
    lastSeenXsecondsAgo({ now = new Date(), seconds = 0 }) {
      properties.heartbeat = new Date(+now - seconds * 1000);
      return this;
    },
    joinedAt(now) {
      properties.heartbeat = now;
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
