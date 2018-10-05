const invariant = require('invariant');
const { withParams } = require('dixit-utils');
const { PlayerJoinedGame } = require('./events/playerJoinedGame');

const PlayersList = withParams(['gameId', 'playersIds'], ({ gameId, playersIds }) => {
  return Object.freeze({
    add: withParams(['player'], ({ player }) => {
      invariant(!playersIds.includes(player.id), 'Player already joined this game');
      return [PlayerJoinedGame({ gameId, playerId: player.id, username: player.username })];
    }),
  });
});

const Game = withParams(['id', 'playersIds'], ({ id, playersIds }) => {
  const playersList = PlayersList({ gameId: id, playersIds });
  return Object.freeze({
    addPlayer({ player }) {
      return playersList.add({ player });
    },
  });
});

module.exports = {
  Game,
};
