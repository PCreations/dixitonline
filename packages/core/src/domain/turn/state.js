const { Record } = require('immutable');
const { events } = require('./events');

const TurnState = Record({
  id: undefined,
  gameId: undefined,
  storytellerId: undefined,
});

const reduceToTurn = event => (turnState = TurnState()) => {
  switch (event.type) {
    case events.types.TURN_STARTED:
      return TurnState({
        id: event.payload.turnId,
        gameId: event.payload.gameId,
        storytellerId: event.payload.storytellerId,
      });
    default:
      return turnState;
  }
};

module.exports = {
  reduceToTurn,
};
