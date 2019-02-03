const { events } = require('./events');
const { getNextStorytellerId } = require('../game/state');

const startTurn = ({ gameState, turnId }) => [
  events.turnStarted({ gameId: gameState.id, turnId, storytellerId: getNextStorytellerId({ gameState }) }),
];

module.exports = {
  startTurn,
};
