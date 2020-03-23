/* eslint-disable no-underscore-dangle */
import { makeCreateNewGame } from '../../../useCases/create-new-game';
import { makeGetGames } from '../../../useCases/get-games';
import { makeJoinGame } from '../../../useCases/join-game';
import { makeStartGame } from '../../../useCases/start-game';
import { makePlayer } from '../../../domain/player';
import { getAllPlayers } from '../../../domain/game';

const makeHandleUseCaseResult = ({ dispatchDomainEvents, result }) => graphQLResultField => {
  if (result.error) {
    return {
      type: result.error,
    };
  }
  dispatchDomainEvents(result.events);
  return {
    [graphQLResultField]: result.value,
  };
};

export const resolvers = {
  Query: {
    games(_, __, { dataSources }) {
      const getGames = makeGetGames({ gameRepository: dataSources.gameRepository });
      return getGames();
    },
  },
  Mutation: {
    async gameCreateGame(_, __, context) {
      const { dataSources, dispatchDomainEvents, currentUser } = context;
      const createNewGame = makeCreateNewGame({ gameRepository: dataSources.gameRepository });
      const result = await createNewGame(makePlayer({ id: currentUser.id, name: currentUser.username }));
      const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
      return handleUseCaseResult('game');
    },
    async gameJoinGame(_, { gameJoinGameInput }, context) {
      const { dataSources, dispatchDomainEvents, currentUser } = context;
      const { gameId } = gameJoinGameInput;
      const joinGame = makeJoinGame({ gameRepository: dataSources.gameRepository });
      const result = await joinGame({ gameId, currentUser });
      const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
      return handleUseCaseResult('game');
    },
    async gameStartGame(_, { gameStartGameInput }, { dataSources, dispatchDomainEvents, currentUser }) {
      const { gameRepository } = dataSources;
      const { gameId } = gameStartGameInput;
      const startGame = makeStartGame({ gameRepository, currentUser });
      const result = await startGame({ gameId });
      const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
      return handleUseCaseResult('gameId');
    },
  },
  Game: {
    players: getAllPlayers,
  },
  GameJoinGameResult: {
    __resolveType(result) {
      return result.type ? 'GameJoinGameResultError' : 'GameJoinGameResultSuccess';
    },
  },
  GameStartGameResult: {
    __resolveType(result) {
      return result.type ? 'GameStartGameResultError' : 'GameStartGameResultSuccess';
    },
  },
};
