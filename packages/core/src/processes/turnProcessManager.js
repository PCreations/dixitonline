const {
  events: { types: gameEventTypes },
} = require('../domain/game/events');
const { commands: turnCommands } = require('../domain/turn/commands');

const TurnProcessManager = ({ getNextTurnId, consumeEvents, sendCommand }) => {
  consumeEvents(async event => {
    if (event.type === gameEventTypes.GAME_STARTED) {
      sendCommand(turnCommands.startTurn({ gameId, turnId: getNextTurnId() }));
    }
  });
};

module.exports = {
  TurnProcessManager,
};
