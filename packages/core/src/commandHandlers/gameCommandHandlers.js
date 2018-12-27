const { validateCommandHasExpectedPayload } = require('./validateCommandHasExpectedPayload');
const {
  commands: { types: commandTypes },
} = require('../domain/game/commands');
const { createNewGame, startGame, addPlayerInGame } = require('../domain/game/behaviors');

const gameCommandHandlers = ({ getGameOfId, getNextGameId }) => ({
  [commandTypes.CREATE_GAME]: (_, authUser) => {
    const gameId = getNextGameId();
    return createNewGame({ hostPlayerName: authUser.name, hostPlayerId: authUser.id, gameId });
  },
  [commandTypes.START_GAME]: async startGameCommand => {
    validateCommandHasExpectedPayload(startGameCommand, 'gameId');
    const gameState = await getGameOfId(startGameCommand.payload.gameId);
    return startGame({ gameState });
  },
  [commandTypes.JOIN_GAME]: async (joinGameCommand, authUser) => {
    validateCommandHasExpectedPayload(joinGameCommand, 'gameId');
    const gameState = await getGameOfId(joinGameCommand.payload.gameId);
    return addPlayerInGame({
      gameState,
      playerId: authUser.id,
      playerName: authUser.name,
    });
  },
});

module.exports = {
  gameCommandHandlers,
};
