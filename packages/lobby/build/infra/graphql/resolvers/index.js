"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolvers = void 0;

var _createNewGame = require("../../../useCases/create-new-game");

var _getGames = require("../../../useCases/get-games");

var _joinGame = require("../../../useCases/join-game");

var _startGame = require("../../../useCases/start-game");

var _player = require("../../../domain/player");

var _game = require("../../../domain/game");

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
      const {
        value,
        events
      } = await createNewGame((0, _player.makePlayer)({
        id: currentUser.id,
        name: currentUser.username
      }));
      dispatchDomainEvents(events);
      return {
        game: value
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
      const result = await joinGame({
        gameId,
        currentUser
      });

      if (result.error) {
        return {
          __typename: 'LobbyJoinGameResultError',
          type: result.error
        };
      }

      dispatchDomainEvents(result.events);
      return {
        __typename: 'LobbyJoinGameResultSuccess',
        game: result.value
      };
    },

    async lobbyStartGame(_, {
      lobbyStartGameInput
    }, {
      dataSources,
      dispatchDomainEvents,
      currentUser
    }) {
      const {
        lobbyRepository
      } = dataSources;
      const {
        gameId
      } = lobbyStartGameInput;
      const startGame = (0, _startGame.makeStartGame)({
        lobbyRepository,
        currentUser
      });
      const result = await startGame({
        gameId
      });

      if (result.error) {
        return {
          __typename: 'LobbyStartGameResultError',
          type: result.error
        };
      }

      dispatchDomainEvents(result.events);
      return {
        __typename: 'LobbyStartGameResultSuccess',
        gameId: result.value
      };
    }

  },
  LobbyGame: {
    players: _game.getAllPlayers
  }
};
exports.resolvers = resolvers;