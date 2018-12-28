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
    GAME_CREATED: '[event][game] - a game has been created',
    DECK_SHUFFLED: '[event][game] - the deck has been shuffled',
    CARDS_DEALT_TO_PLAYER: '[event][game] - cards have been dealt to a player',
    DRAW_PILE_CONSTITUTED: '[event][game] - the draw pile has been constituted',
    GAME_STARTED: '[event][game] - the game has started',
    PLAYER_HAS_JOINED_A_GAME: '[event][game] - a player has joined the game',
    PLAYER_HAS_QUITTED_A_GAME: '[event][game] - a player has quitted the game',
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game
   */
  gameCreated({ gameId }) {
    return GameEvent({ type: events.types.GAME_CREATED, payload: { gameId } });
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
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game
   * @param {string} payload.playerId - the id of the player that has joined the game
   * @param {string} payload.playerName - the name of the player that has joined the game
   */
  playerHasJoinedAgame({ gameId, playerId, playerName }) {
    return GameEvent({
      type: events.types.PLAYER_HAS_JOINED_A_GAME,
      payload: { gameId, playerId, playerName },
    });
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game
   * @param {string} payload.playerId - the id of the player that has joined the game
   */
  playerHasQuittedAgame({ gameId, playerId }) {
    return GameEvent({
      type: events.types.PLAYER_HAS_QUITTED_A_GAME,
      payload: { gameId, playerId },
    });
  },
};

module.exports = {
  events,
};
