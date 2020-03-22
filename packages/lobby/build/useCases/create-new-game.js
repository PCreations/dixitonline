"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeCreateNewGame = void 0;

var _game = require("../domain/game");

const makeCreateNewGame = ({
  lobbyRepository
}) => async host => {
  const gameId = lobbyRepository.getNextGameId();
  const result = (0, _game.createGame)({
    gameId,
    host
  });

  if (!result.error) {
    await lobbyRepository.saveGame(result.value);
  }

  return result;
};

exports.makeCreateNewGame = makeCreateNewGame;