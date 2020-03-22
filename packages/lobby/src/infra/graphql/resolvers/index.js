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
    lobbyGames(_, __, { dataSources }) {
      const getGames = makeGetGames({ lobbyRepository: dataSources.lobbyRepository });
      return getGames();
    },
  },
  Mutation: {
    async lobbyCreateGame(_, __, context) {
      const { dataSources, dispatchDomainEvents, currentUser } = context;
      const createNewGame = makeCreateNewGame({ lobbyRepository: dataSources.lobbyRepository });
      const result = await createNewGame(makePlayer({ id: currentUser.id, name: currentUser.username }));
      const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
      return handleUseCaseResult('game');
    },
    async lobbyJoinGame(_, { lobbyJoinGameInput }, context) {
      const { dataSources, dispatchDomainEvents, currentUser } = context;
      const { gameId } = lobbyJoinGameInput;
      const joinGame = makeJoinGame({ lobbyRepository: dataSources.lobbyRepository });
      const result = await joinGame({ gameId, currentUser });
      const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
      return handleUseCaseResult('game');
    },
    async lobbyStartGame(_, { lobbyStartGameInput }, { dataSources, dispatchDomainEvents, currentUser }) {
      const { lobbyRepository } = dataSources;
      const { gameId } = lobbyStartGameInput;
      const startGame = makeStartGame({ lobbyRepository, currentUser });
      const result = await startGame({ gameId });
      const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
      return handleUseCaseResult('gameId');
    },
  },
  LobbyGame: {
    players: getAllPlayers,
  },
  LobbyJoinGameResult: {
    __resolveType(result) {
      return result.type ? 'LobbyJoinGameResultError' : 'LobbyJoinGameResultSuccess';
    },
  },
  LobbyStartGameResult: {
    __resolveType(result) {
      return result.type ? 'LobbyStartGameResultError' : 'LobbyStartGameResultSuccess';
    },
  },
};
