const { Repository } = require('../repository');
const { type: PLAYER_CREATED } = require('./events/playerCreated');

const playerReducer = ({ id, username }, event) => {
  let playerState = { id, username };
  switch (event.type) {
    case PLAYER_CREATED:
      playerState = {
        id,
        username: event.payload.username,
      };
      break;
  }
  return playerState;
};

const PlayerRepository = Repository({
  aggregateReducer: playerReducer,
  aggregateName: 'player',
});

module.exports = {
  PlayerRepository,
};
