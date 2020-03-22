"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startGame = exports.joinPlayer = exports.createGame = exports.getAllPlayers = exports.makeGame = exports.MINIMUM_NUMBER_OF_PLAYERS = exports.MAXIMUM_NUMBER_OF_PLAYERS = exports.GameError = void 0;

var _events = require("./events");

var _player = require("./player");

var _result = require("./result");

/* eslint-disable max-classes-per-file */
const GameError = {
  GAME_ALREADY_JOINED: 'GAME_ALREADY_JOINED',
  MAXIMUM_NUMBER_OF_PLAYERS_REACHED: 'MAXIMUM_NUMBER_OF_PLAYERS_REACHED',
  ONLY_HOST_CAN_START_GAME: 'ONLY_HOST_CAN_START_GAME',
  NOT_ENOUGH_PLAYERS: 'NOT_ENOUGH_PLAYERS'
};
exports.GameError = GameError;
const MAXIMUM_NUMBER_OF_PLAYERS = 6;
exports.MAXIMUM_NUMBER_OF_PLAYERS = MAXIMUM_NUMBER_OF_PLAYERS;
const MINIMUM_NUMBER_OF_PLAYERS = 3;
exports.MINIMUM_NUMBER_OF_PLAYERS = MINIMUM_NUMBER_OF_PLAYERS;

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

const getAllPlayers = game => [game.host, ...game.players];

exports.getAllPlayers = getAllPlayers;

const isGameFull = game => getAllPlayers(game).length === MAXIMUM_NUMBER_OF_PLAYERS;

const createGame = ({
  gameId,
  host
}) => (0, _result.makeResult)(makeGame({
  id: gameId,
  host
}), [(0, _events.newGameCreatedEvent)({
  gameId
})]);

exports.createGame = createGame;

const joinPlayer = (game, player) => {
  if (getAllPlayers(game).some(_player.equals.bind(null, player))) return (0, _result.makeErrorResult)(GameError.GAME_ALREADY_JOINED);
  if (isGameFull(game)) return (0, _result.makeErrorResult)(GameError.MAXIMUM_NUMBER_OF_PLAYERS_REACHED);
  return (0, _result.makeResult)(makeGame({ ...game,
    players: game.players.concat(player)
  }), [(0, _events.playerJoinedGame)({
    gameId: game.id,
    playerId: player.id
  })]);
};

exports.joinPlayer = joinPlayer;

const startGame = (game, player) => {
  if (getAllPlayers(game).length < MINIMUM_NUMBER_OF_PLAYERS) {
    return (0, _result.makeErrorResult)(GameError.NOT_ENOUGH_PLAYERS);
  }

  if ((0, _player.equals)(game.host, player)) {
    return (0, _result.makeResult)(game.id, [(0, _events.newGameStartedEvent)({
      gameId: game.id,
      playerIds: getAllPlayers(game).map(({
        id
      }) => id)
    })]);
  }

  return (0, _result.makeErrorResult)(GameError.ONLY_HOST_CAN_START_GAME);
};

exports.startGame = startGame;