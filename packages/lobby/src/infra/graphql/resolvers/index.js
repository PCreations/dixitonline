import { makeCreateNewGame } from '../../../useCases/create-new-game';
import { makeGetGames } from '../../../useCases/get-games';
import { makeJoinGame } from '../../../useCases/join-game';
import { makeStartGame } from '../../../useCases/start-game';
import { makePlayer } from '../../../domain/player';
import { getAllPlayers } from '../../../domain/game';

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
      const { value, events } = await createNewGame(makePlayer({ id: currentUser.id, name: currentUser.username }));
      dispatchDomainEvents(events);
      return {
        game: value,
      };
    },
    async lobbyJoinGame(_, { lobbyJoinGameInput }, context) {
      const { dataSources, dispatchDomainEvents, currentUser } = context;
      const { gameId } = lobbyJoinGameInput;
      const joinGame = makeJoinGame({ lobbyRepository: dataSources.lobbyRepository });
      const result = await joinGame({ gameId, currentUser });
      if (result.error) {
        return {
          __typename: 'LobbyJoinGameResultError',
          type: result.error,
        };
      }
      dispatchDomainEvents(result.events);
      return {
        __typename: 'LobbyJoinGameResultSuccess',
        game: result.value,
      };
    },
    async lobbyStartGame(_, { lobbyStartGameInput }, { dataSources, dispatchDomainEvents, currentUser }) {
      const { lobbyRepository } = dataSources;
      const { gameId } = lobbyStartGameInput;
      const startGame = makeStartGame({ lobbyRepository, currentUser });
      const result = await startGame({ gameId });
      if (result.error) {
        return {
          __typename: 'LobbyStartGameResultError',
          type: result.error,
        };
      }
      dispatchDomainEvents(result.events);
      return {
        __typename: 'LobbyStartGameResultSuccess',
        gameId: result.value,
      };
    },
  },
  LobbyGame: {
    players: getAllPlayers,
  },
};
