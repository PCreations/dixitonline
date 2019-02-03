const {
  events: { types: gameEventTypes },
} = require('../domain/game/events');
const { commands: gameCommands } = require('../domain/game/commands');

const GameProcessManager = ({ getGameOfId, consumeEvents, sendCommand }) => {
  consumeEvents(async event => {});
};

module.exports = {
  GameProcessManager,
};
