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

const startGame = ({ gameState, players, shuffledDeck }) => {
  const gameCanStartOrError = canGameBeStarted({ gameState });
  invariant(gameCanStartOrError === true, gameCanStartOrError);
  return [
    ...definePlayersOrder({ gameState, players }),
    ...shuffleDeck({ gameState, shuffledDeck }),
    events.gameStarted({ gameId: gameState.id }),
  ];
};

const definePlayersOrder = ({ gameState, players }) => {
  invariant(gameState.playersOrder.size === 0, errors.PLAYERS_ORDER_ALREADY_DEFINED);
  return [events.playersOrderDefined({ gameId: gameState.id, players })];
};

const shuffleDeck = ({ gameState, shuffledDeck }) => [
  events.deckShuffled({ gameId: gameState.id, shuffledDeck }),
];

module.exports = {
  createNewGame,
  addPlayerInGame,
  removePlayerFromGame,
  startGame,
};
