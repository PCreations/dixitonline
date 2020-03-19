"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.newGameCreatedEvent = void 0;

const newGameCreatedEvent = ({
  gameId
}) => ({
  type: '[lobby] - a new game has been created',
  payload: {
    gameId
  }
});

exports.newGameCreatedEvent = newGameCreatedEvent;