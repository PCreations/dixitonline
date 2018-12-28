const invariant = require('invariant');
const { events } = require('./events');
const { errors } = require('./errors');
const {
  isMaximumNumberOfPlayersReached,
  canPlayerJoinGame,
  canGameBeStarted,
  reduceToGame,
} = require('./state');

const createNewGame = ({ hostPlayerName, hostPlayerId, gameId }) => [
  events.gameCreated({ gameId }),
  events.playerHasJoinedAgame({ gameId, playerName: hostPlayerName, playerId: hostPlayerId }),
];

const addPlayerInGame = ({ gameState, playerId, playerName }) => {
  const playerCanJoinGameOrError = canPlayerJoinGame({ gameState, playerId });
  invariant(playerCanJoinGameOrError === true, playerCanJoinGameOrError);
  const gameEvents = [events.playerHasJoinedAgame({ gameId: gameState.id, playerId, playerName })];
  const newGameState = reduceToGame(gameEvents[0])(gameState);
  if (isMaximumNumberOfPlayersReached({ gameState: newGameState })) {
    gameEvents.push(events.gameStarted({ gameId: gameState.id }));
  }
  return gameEvents;
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
