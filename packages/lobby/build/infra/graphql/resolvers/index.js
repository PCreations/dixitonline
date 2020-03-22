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

/* eslint-disable no-underscore-dangle */
const makeHandleUseCaseResult = ({
  dispatchDomainEvents,
  result
}) => graphQLResultField => {
  if (result.error) {
    return {
      type: result.error
    };
  }

  dispatchDomainEvents(result.events);
  return {
    [graphQLResultField]: result.value
  };
};

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
      const result = await createNewGame((0, _player.makePlayer)({
        id: currentUser.id,
        name: currentUser.username
      }));
      const handleUseCaseResult = makeHandleUseCaseResult({
        dispatchDomainEvents,
        result
      });
      return handleUseCaseResult('game');
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
      const handleUseCaseResult = makeHandleUseCaseResult({
        dispatchDomainEvents,
        result
      });
      return handleUseCaseResult('game');
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
      const handleUseCaseResult = makeHandleUseCaseResult({
        dispatchDomainEvents,
        result
      });
      return handleUseCaseResult('gameId');
    }

  },
  LobbyGame: {
    players: _game.getAllPlayers
  },
  LobbyJoinGameResult: {
    __resolveType(result) {
      return result.type ? 'LobbyJoinGameResultError' : 'LobbyJoinGameResultSuccess';
    }

  },
  LobbyStartGameResult: {
    __resolveType(result) {
      return result.type ? 'LobbyStartGameResultError' : 'LobbyStartGameResultSuccess';
    }

  }
};
exports.resolvers = resolvers;