import faker from 'faker';
import { buildTestPlayer } from './player';
import { makeGame } from '../../domain/game';

export const buildTestGame = (baseGame = {}) => {
  const defaultProperties = {
    id: faker.random.uuid(),
    host: buildTestPlayer().build(),
    players: [],
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
    withPlayers(players = defaultProperties.players) {
      overrides.players = players;
      return this;
    },
    build() {
      return makeGame({
        ...defaultProperties,
        ...baseGame,
        ...overrides,
      });
    },
  };
};
