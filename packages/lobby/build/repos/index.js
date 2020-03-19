"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lobbyRepository = require("./lobby-repository");

Object.keys(_lobbyRepository).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _lobbyRepository[key];
    }
  });
});