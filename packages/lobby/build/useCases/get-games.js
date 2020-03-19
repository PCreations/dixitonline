"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeGetGames = void 0;

const makeGetGames = ({
  lobbyRepository
}) => () => lobbyRepository.getAllGames();

exports.makeGetGames = makeGetGames;