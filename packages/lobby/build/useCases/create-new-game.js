"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeCreateNewGame = void 0;

var _game = require("../domain/game");

var _events = require("../domain/events");

const makeCreateNewGame = ({
  lobbyRepository
}) => async () => {
  const gameId = lobbyRepository.getNextGameId();
  const game = (0, _game.makeGame)({
    id: gameId
  });
  const domainEvents = [(0, _events.newGameCreatedEvent)({
    gameId
  })];
  console.log('saving game', game);
  await lobbyRepository.createGame(game);
  return [game, domainEvents];
};

exports.makeCreateNewGame = makeCreateNewGame;