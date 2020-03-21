"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeCreateNewGame = void 0;

var _game = require("../domain/game");

var _events = require("../domain/events");

const makeCreateNewGame = ({
  lobbyRepository
}) => async host => {
  const gameId = lobbyRepository.getNextGameId();
  const game = (0, _game.makeGame)({
    id: gameId,
    host
  });
  const domainEvents = [(0, _events.newGameCreatedEvent)({
    gameId
  })];
  await lobbyRepository.saveGame(game);
  return [game, domainEvents];
};

exports.makeCreateNewGame = makeCreateNewGame;