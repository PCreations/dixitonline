import faker from 'faker';
import { makeTurn, MINIMUM_PLAYERS } from '../../domain/turn';
import { buildTestPlayer } from './player';

export const buildTestTurn = () => {
  const defaultPlayers = new Array(MINIMUM_PLAYERS).fill().map(() => buildTestPlayer().build());
  const defaultProperties = {
    id: faker.random.uuid(),
    players: defaultPlayers,
    storytellerId: defaultPlayers[0].id,
  };
  const overrides = {};
  return {
    withStorytellerId(storytellerId = defaultProperties.storytellerId) {
      overrides.storytellerId = storytellerId;
      return this;
    },
    withPlayers(players = defaultProperties.players) {
      overrides.players = players;
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
