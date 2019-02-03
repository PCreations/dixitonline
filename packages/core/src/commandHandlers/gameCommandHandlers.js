const { validateCommandHasExpectedPayload } = require('./validateCommandHasExpectedPayload');
const {
  commands: { types: commandTypes },
} = require('../domain/game/commands');
const { createNewGame, startGame, addPlayerInGame } = require('../domain/game/behaviors');
const { shuffleDeck } = require('../domain/game/state');

const gameCommandHandlers = ({ getGameOfId, getPlayerOfId, getNextGameId, shuffle }) => ({
  [commandTypes.CREATE_GAME]: (_, authUser) => {
    const gameId = getNextGameId();
    return createNewGame({ hostPlayerName: authUser.name, hostPlayerId: authUser.id, gameId });
  },
  [commandTypes.START_GAME]: async startGameCommand => {
    validateCommandHasExpectedPayload(startGameCommand, 'gameId');
    const gameState = await getGameOfId(startGameCommand.payload.gameId);
    const players = await Promise.all(gameState.players.toArray().map(getPlayerOfId));
    const shuffledDeck = shuffleDeck({ gameState, shuffle });
    return startGame({ gameState, players: shuffle(players), shuffledDeck });
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
