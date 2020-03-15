"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolvers = void 0;
const resolvers = {
  Query: {
    game(_, {
      id
    }) {
      if (id === 42) {
        return 'Game42';
      }

      return 'NotFoundGame';
    }

  }
};
exports.resolvers = resolvers;