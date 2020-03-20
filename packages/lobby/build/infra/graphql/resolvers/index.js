"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolvers = void 0;

var _createNewGame = require("../../../useCases/create-new-game");

var _getGames = require("../../../useCases/get-games");

var _player = require("../../../domain/player");

const resolvers = {
  Query: {
    lobbyGames(_, __, {
      dataSources
    }) {
      const getGames = (0, _getGames.makeGetGames)({
        lobbyRepository: dataSources.lobbyRepository
      });
      return getGames();
    }

  },
  Mutation: {
    async lobbyCreateGame(_, __, {
      dataSources,
      dispatchDomainEvents
    }) {
      const createNewGame = (0, _createNewGame.makeCreateNewGame)({
        lobbyRepository: dataSources.lobbyRepository
      });
      const [game, domainEvents] = await createNewGame((0, _player.makePlayer)({
        id: 'p1',
        name: 'player1'
      }));
      dispatchDomainEvents(domainEvents);
      return {
        game
      };
    }

  }
};
exports.resolvers = resolvers;