"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeGame = void 0;

const makeGame = ({
  id
} = {}) => {
  if (!id) throw new Error('Game must contain an id');
  return Object.freeze({
    id
  });
};

exports.makeGame = makeGame;