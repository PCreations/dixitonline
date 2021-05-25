import faker from 'faker';
import { buildTestPlayer } from './player';
import { makeGame, MAXIMUM_NUMBER_OF_PLAYERS, GameStatus, makeNullCards } from '../../domain/game';

const generatePlayers = numberOfPlayers => new Array(numberOfPlayers).fill().map(() => buildTestPlayer().build());

export const buildTestGame = (baseGame = {}) => {
  const defaultProperties = {
    id: faker.random.uuid(),
    host: buildTestPlayer().build(),
    isPrivate: true,
    players: [],
    cards: makeNullCards(),
    drawPile: [],
    score: {},
    status: GameStatus.WAITING_FOR_PLAYERS,
  };
  const overrides = {};
  return {
    withId(id = defaultProperties.id) {
      overrides.id = id;
      return this;
    },
    asPublic() {
      overrides.isPrivate = false;
      return this;
    },
    withCards(length) {
      overrides.cards = new Array(length).fill().map((_, index) => ({
        id: `c${index}`,
        url: `/cards/${index}.jpg`,
      }));
      return this;
    },
    withDrawPile(drawPile = defaultProperties.drawPile) {
      overrides.drawPile = drawPile;
      return this;
    },
    withCurrentTurnId(turnId) {
      overrides.currentTurn = {
        ...(overrides.currentTurn || {}),
        id: turnId,
      };
      return this;
    },
    withCurrentTurnNumber(turnNumber) {
      overrides.currentTurn = {
        ...(overrides.currentTurn || {}),
        number: turnNumber,
      };
      return this;
    },
    withStartedStatus() {
      overrides.status = GameStatus.STARTED;
      return this;
    },
    withEndedStatus() {
      overrides.status = GameStatus.ENDED;
      return this;
    },
    withShuffledDeck(cards) {
      overrides.cards = [...cards];
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
    withScore(scores = []) {
      const props = {
        ...defaultProperties,
        ...baseGame,
        ...overrides,
      };
      overrides.score = [props.host.id, ...props.players.map(p => p.id)].reduce(
        (score, playerId, index) => ({
          ...score,
          [playerId]: scores[index] || faker.random.number(10),
        }),
        {}
      );
      return this;
    },
    asFullGame() {
      overrides.players = generatePlayers(MAXIMUM_NUMBER_OF_PLAYERS - 1);
      return this;
    },
    withXtimesStorytellerLimit(xTimesStorytellerLimit) {
      overrides.endCondition = {
        xTimesStorytellerLimit,
      };
      return this;
    },
    withScoreLimit(limit) {
      overrides.endCondition = {
        scoreLimit: limit,
      };
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
