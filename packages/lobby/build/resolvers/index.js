"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolvers = void 0;

var _greeter = require("../greeter");

const resolvers = {
  Query: {
    greet(_, {
      name
    }) {
      return (0, _greeter.greeter)(name);
    }

  }
};
exports.resolvers = resolvers;