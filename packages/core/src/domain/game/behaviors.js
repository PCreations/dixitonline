const invariant = require('invariant');
const { events } = require('./events');
const { canPlayerJoinGame, canGameBeStarted } = require('./state');

const createNewGame = ({ playerState, gameId }) => [
  events.gameCreated({ gameId }),
  events.playerHasJoinedAgame({ gameId, playerId: playerState.id }),
];

const addPlayerInGame = ({ gameState, playerId }) => {
  invariant(canPlayerJoinGame({ gameState, playerId }), 'Impossible to join the game');
  return [events.playerHasJoinedAgame({ gameId: gameState.id, playerId })];
};

const startGame = ({ gameState }) => {
  invariant(canGameBeStarted({ gameState }), 'Cannot start the game');
  return [events.gameStarted({ gameId: gameState.id })];
};

module.exports = {
  createNewGame,
  addPlayerInGame,
  startGame,
};
