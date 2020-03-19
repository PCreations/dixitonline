"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "resolvers", {
  enumerable: true,
  get: function () {
    return _resolvers.resolvers;
  }
});
Object.defineProperty(exports, "typeDefs", {
  enumerable: true,
  get: function () {
    return _typeDefs.typeDefs;
  }
});
exports.makeGetContext = exports.makeGetDataSources = void 0;

var _resolvers = require("./resolvers");

var _typeDefs = require("./typeDefs");

const makeGetDataSources = () => () => ({});

exports.makeGetDataSources = makeGetDataSources;

const makeGetContext = () => () => ({});

exports.makeGetContext = makeGetContext;