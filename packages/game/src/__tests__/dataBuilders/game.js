import faker from 'faker';
import { buildTestPlayer } from './player';
import { makeGame, MAXIMUM_NUMBER_OF_PLAYERS, GameStatus } from '../../domain/game';

const generatePlayers = numberOfPlayers => new Array(numberOfPlayers).fill().map(() => buildTestPlayer().build());

export const buildTestGame = (baseGame = {}) => {
  const defaultProperties = {
    id: faker.random.uuid(),
    host: buildTestPlayer().build(),
    players: [],
    status: GameStatus.WAITING_FOR_PLAYERS,
  };
  const overrides = {};
  return {
    withId(id = defaultProperties.id) {
      overrides.id = id;
      return this;
    },
    withStartedStatus() {
      overrides.status = GameStatus.STARTED;
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
    withXPlayers(numberOfPlayers) {
      overrides.players = generatePlayers(numberOfPlayers);
      return this;
    },
    asFullGame() {
      overrides.players = generatePlayers(MAXIMUM_NUMBER_OF_PLAYERS - 1);
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
