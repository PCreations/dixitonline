const pipe = require('lodash.flow');
const { ensureRequiredArgument } = require('common/src/invariants');
const { Event, withAggregateMeta } = require('common/src/events');

const TurnEvent = pipe(
  ensureRequiredArgument({
    ensureArg: ({ payload = {} } = {}) => typeof payload.turnId !== 'undefined',
    errorMessage: 'a TurnEvent must have a "turnId" property in its payload',
  }),
  Event,
  withAggregateMeta({ aggregateName: 'turn', aggregateId: ({ payload }) => payload.turnId }),
);

const events = {
  types: {
    TURN_STARTED: '[event][game] - a new turn has started',
  },
  /**
   *
   * @param {object} payload
   * @param {string} payload.gameId - the id of the game
   * @param {string} payload.turnId - the id of the turn
   * @param {string} payload.storytellerId - the id of the storyteller for this turn
   */
  turnStarted({ gameId, turnId, storytellerId }) {
    return TurnEvent({ gameId, turnId, storytellerId });
  },
};

module.exports = {
  events,
};
