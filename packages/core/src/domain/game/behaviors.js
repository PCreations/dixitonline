const invariant = require('invariant');
const { events } = require('./events');
const { canPlayerJoinGame, canGameBeStarted } = require('./state');

const createNewGame = ({ hostPlayerName, hostPlayerId, gameId }) => [
  events.gameCreated({ gameId }),
  events.playerHasJoinedAgame({ gameId, playerName: hostPlayerName, playerId: hostPlayerId }),
];

const addPlayerInGame = ({ gameState, playerId, playerName }) => {
  invariant(canPlayerJoinGame({ gameState, playerId }), 'Impossible to join the game');
  return [events.playerHasJoinedAgame({ gameId: gameState.id, playerId, playerName })];
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
