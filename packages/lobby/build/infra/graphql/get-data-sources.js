"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeGetDataSources = void 0;

var _lobbyRepository = require("../../repos/lobby-repository");

const makeGetDataSources = ({
  lobbyRepository = (0, _lobbyRepository.makeLobbyRepository)()
} = {}) => () => ({
  lobbyRepository
});

exports.makeGetDataSources = makeGetDataSources;