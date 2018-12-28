const {
  events: { types: gameEventTypes },
} = require('../domain/game/events');
const { commands: gameCommands } = require('../domain/game/commands');

const GameProcessManager = ({ getGameOfId, consumeEvents, sendCommand, sendError }) => {
  consumeEvents(async event => {
    switch (event.type) {
      case gameEventTypes.GAME_STARTED: {
        const gameState = await getGameOfId(event.payload.gameId);
        //sendCommand(gameCommands.);
      }
    }
  });
};
