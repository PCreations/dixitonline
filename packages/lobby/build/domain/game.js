"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.joinPlayer = exports.makeGame = void 0;

var _events = require("./events");

const makeGame = ({
  id,
  host,
  players = []
} = {}) => {
  if (!id) throw new Error('Game must contain an id');
  if (!host) throw new Error('Game must have an host');
  return Object.freeze({
    id,
    host,
    players
  });
};

exports.makeGame = makeGame;

const joinPlayer = (game, player) => [makeGame({ ...game,
  players: game.players.concat(player)
}), [(0, _events.playerJoinedGame)({
  gameId: game.id,
  playerId: player.id
})]];

exports.joinPlayer = joinPlayer;