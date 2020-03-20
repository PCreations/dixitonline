"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeGame = void 0;

const makeGame = ({
  id,
  host
} = {}) => {
  if (!id) throw new Error('Game must contain an id');
  if (!host) throw new Error('Game must have an host');
  return Object.freeze({
    id,
    host
  });
};

exports.makeGame = makeGame;