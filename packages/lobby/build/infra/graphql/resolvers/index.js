"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolvers = void 0;

var _createNewGame = require("../../../useCases/create-new-game");

var _getGames = require("../../../useCases/get-games");

var _player = require("../../../domain/player");

var _game = require("../../../domain/game");

var _events = require("../../../domain/events");

var _joinGame = require("../../../useCases/join-game");

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
    async lobbyCreateGame(_, __, context) {
      const {
        dataSources,
        dispatchDomainEvents,
        currentUser
      } = context;
      const createNewGame = (0, _createNewGame.makeCreateNewGame)({
        lobbyRepository: dataSources.lobbyRepository
      });
      const [game, domainEvents] = await createNewGame((0, _player.makePlayer)({
        id: currentUser.id,
        name: currentUser.username
      }));
      dispatchDomainEvents(domainEvents);
      return {
        game
      };
    },

    async lobbyJoinGame(_, {
      lobbyJoinGameInput
    }, context) {
      const {
        dataSources,
        dispatchDomainEvents,
        currentUser
      } = context;
      const {
        gameId
      } = lobbyJoinGameInput;
      const joinGame = (0, _joinGame.makeJoinGame)({
        lobbyRepository: dataSources.lobbyRepository
      });
      const [game, domainEvents] = await joinGame({
        gameId,
        currentUser
      });
      dispatchDomainEvents(domainEvents);
      return {
        game
      };
    }

  }
};
exports.resolvers = resolvers;