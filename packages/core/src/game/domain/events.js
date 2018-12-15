const pipe = require('lodash.flow');
const { ensureRequiredArgument } = require('common/src/invariants');
const { Event, withAggregateMeta } = require('common/src/events');

const GameEvent = pipe(
  ensureRequiredArgument({
    ensureArg: ({ payload = {} } = {}) => typeof payload.gameId !== 'undefined',
    errorMessage: 'a GameEvent must have a "gameId" property in its payload',
  }),
  Event,
  withAggregateMeta({ aggregateName: 'game', aggregateId: ({ payload }) => payload.gameId }),
);

const events = {
  types: {
    PLAYERS_ORDER_DEFINED: '[event][game] - the order of players has been defined',
    DECK_SHUFFLED: '[event][game] - the deck has been shuffled',
    CARDS_DEALT_TO_PLAYER: '[event][game] - cards have been dealt to a player',
    DRAW_PILE_CONSTITUTED: '[event][game] - the draw pile has been constituted',
    GAME_STARTED: '[event][game] - the game has started',
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game
   * @param {[string]} payload.players - an array of the player's id, order in array represents the player's order
   */
  playersOrderDefined({ gameId, players }) {
    return GameEvent({ type: events.types.PLAYERS_ORDER_DEFINED, payload: { gameId, players } });
  },
  /**
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game
   * @param {[string]} payload.cards - an array of the card's id, order in array represents the card's order
   */
  deckShuffled({ gameId, cards }) {
    return GameEvent({ type: events.types.DECK_SHUFFLED, payload: { gameId, cards } });
  },
  /**
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game
   * @param {string} payload.playerId - the id of the player whom the cards has been dealt to
   * @param {[string]} payload.cards - an array of the card's id, order in array represents the card's order
   */
  cardsDealtToPlayer({ gameId, playerId, cards }) {
    return GameEvent({ type: events.types.CARDS_DEALT_TO_PLAYER, paylaod: { gameId, playerId, cards } });
  },
  /**
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game
   * @param {[string]} payload.cards - an array of the card's id, order in array represents the card's order
   */
  drawPileConstituted({ gameId, cards }) {
    return GameEvent({ type: events.types.DRAW_PILE_CONSTITUTED, payload: { gameId, cards } });
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game
   */
  gameStarted({ gameId }) {
    return GameEvent({ type: events.types.GAME_STARTED, payload: { gameId } });
  },
};
