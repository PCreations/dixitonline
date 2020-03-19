"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeGetContext = void 0;

const makeGetContext = ({
  dispatchDomainEvents
} = {}) => () => ({
  dispatchDomainEvents
});

exports.makeGetContext = makeGetContext;