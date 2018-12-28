const invariant = require('invariant');
const { events } = require('./events');
const { errors } = require('./errors');
const { canPlayerJoinGame, canGameBeStarted } = require('./state');

const createNewGame = ({ hostPlayerName, hostPlayerId, gameId }) => [
  events.gameCreated({ gameId }),
  events.playerHasJoinedAgame({ gameId, playerName: hostPlayerName, playerId: hostPlayerId }),
];

const addPlayerInGame = ({ gameState, playerId, playerName }) => {
  const playerCanJoinGameOrError = canPlayerJoinGame({ gameState, playerId });
  invariant(playerCanJoinGameOrError === true, playerCanJoinGameOrError);
  return [events.playerHasJoinedAgame({ gameId: gameState.id, playerId, playerName })];
};

const removePlayerFromGame = ({ gameState, playerId }) => {
  invariant(canPlayerQuitGame({ gameState, playerId }), errors.IMPOSSIBLE_TO_QUIT_THE_GAME);
  return [events.playerHasQuittedAgame({ gameState, playerId })];
};

const startGame = ({ gameState }) => {
  const gameCanStartOrError = canGameBeStarted({ gameState });
  invariant(gameCanStartOrError === true, gameCanStartOrError);
  return [events.gameStarted({ gameId: gameState.id })];
};

module.exports = {
  createNewGame,
  addPlayerInGame,
  removePlayerFromGame,
  startGame,
};
