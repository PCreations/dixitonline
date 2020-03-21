"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.playerJoinedGame = exports.newGameCreatedEvent = void 0;

const newGameCreatedEvent = ({
  gameId
}) => ({
  type: '[lobby] - a new game has been created',
  payload: {
    gameId
  }
});

exports.newGameCreatedEvent = newGameCreatedEvent;

const playerJoinedGame = ({
  gameId,
  playerId
}) => ({
  type: '[lobby] - a new player has joined a game',
  payload: {
    gameId,
    playerId
  }
});

exports.playerJoinedGame = playerJoinedGame;