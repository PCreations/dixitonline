const { validateCommandHasExpectedPayload } = require('./validateCommandHasExpectedPayload');
const {
  commands: { types: commandTypes },
} = require('../domain/game/commands');
const { createNewGame, startGame, addPlayerInGame } = require('../domain/game/behaviors');
const { selectPlayerOfId, selectGameOfId } = require('../domain/state');

const gameCommandHandlers = ({ getNextGameId }) => ({
  [commandTypes.CREATE_GAME]: (state, createGameCommand) => {
    validateCommandHasExpectedPayload(createGameCommand, 'hostPlayerId');
    const playerState = selectPlayerOfId(state, createGameCommand.payload.hostPlayerId);
    const gameId = getNextGameId();
    return createNewGame({ playerState, gameId });
  },
  [commandTypes.START_GAME]: (state, startGameCommand) => {
    validateCommandHasExpectedPayload(startGameCommand, 'gameId');
    const gameState = selectGameOfId(state, startGameCommand.payload.gameId);
    return startGame({ gameState });
  },
  [commandTypes.ADD_PLAYER_IN_GAME]: (state, addPlayerInGameCommand) => {
    validateCommandHasExpectedPayload(addPlayerInGameCommand, 'gameId', 'playerId');
    const gameState = selectGameOfId(state, addPlayerInGameCommand.payload.gameId);
    return addPlayerInGame({ gameState, playerId: addPlayerInGameCommand.payload.playerId });
  },
});

module.exports = {
  gameCommandHandlers,
};
