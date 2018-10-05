const { Repository } = require('../repository');
const { Game } = require('./game');
const { type: GAME_CREATED } = require('./events/gameCreated');
const { type: PLAYER_JOINED_GAME } = require('./events/playerJoinedGame');

// TODO : manage version
const gameReducer = ({ id, playersIds = [] }, event) => {
  let gameState = { id, playersIds };
  switch (event.type) {
    case GAME_CREATED:
      gameState = {
        ...gameState,
        playersIds: [event.payload.playerId],
      };
      break;
    case PLAYER_JOINED_GAME:
      gameState = {
        ...gameState,
        playersIds: [...gameState.playersIds, event.payload.playerId],
      };
      break;
  }
  return Game(gameState);
};

const GameRepository = Repository({
  aggregateReducer: gameReducer,
  aggregateName: 'game',
});

module.exports = {
  GameRepository,
};
