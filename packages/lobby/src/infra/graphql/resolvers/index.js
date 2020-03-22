import { makeCreateNewGame } from '../../../useCases/create-new-game';
import { makeGetGames } from '../../../useCases/get-games';
import { makeJoinGame } from '../../../useCases/join-game';
import { makeStartGame } from '../../../useCases/start-game';
import { makePlayer } from '../../../domain/player';
import {
  GameAlreadyJoinedByPlayerError,
  MaximumNumberOfPlayerReachedError,
  OnlyHostCanStartGameError,
} from '../../../domain/game';

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
      const [game, domainEvents] = await createNewGame(makePlayer({ id: currentUser.id, name: currentUser.username }));
      dispatchDomainEvents(domainEvents);
      return {
        game,
      };
    },
    async lobbyJoinGame(_, { lobbyJoinGameInput }, context) {
      const { dataSources, dispatchDomainEvents, currentUser } = context;
      const { gameId } = lobbyJoinGameInput;
      const joinGame = makeJoinGame({ lobbyRepository: dataSources.lobbyRepository });
      try {
        const [game, domainEvents] = await joinGame({ gameId, currentUser });
        dispatchDomainEvents(domainEvents);
        return {
          __typename: 'LobbyJoinGameResultSuccess',
          game,
        };
      } catch (error) {
        const knownErrors = [GameAlreadyJoinedByPlayerError, MaximumNumberOfPlayerReachedError];
        if (knownErrors.some(KnownError => error instanceof KnownError)) {
          const type =
            error instanceof GameAlreadyJoinedByPlayerError
              ? 'GAME_ALREADY_JOINED'
              : 'MAXIMUM_NUMBER_OF_PLAYERS_REACHED';
          return {
            __typename: 'LobbyJoinGameResultError',
            type,
          };
        }
        throw error;
      }
    },
    async lobbyStartGame(_, { lobbyStartGameInput }, { dataSources, dispatchDomainEvents, currentUser }) {
      const { lobbyRepository } = dataSources;
      const { gameId } = lobbyStartGameInput;
      const startGame = makeStartGame({ lobbyRepository, currentUser });
      const result = await startGame({ gameId });
      if (result.error) {
        if (result.error instanceof OnlyHostCanStartGameError) {
          return {
            __typename: 'LobbyStartGameResultError',
            type: 'ONLY_HOST_CAN_START_GAME',
          };
        }
      }
      dispatchDomainEvents(result.events);
      return {
        __typename: 'LobbyStartGameResultSuccess',
        gameId: result.value,
      };
    },
  },
  LobbyGame: {
    players: game => [game.host, ...game.players],
  },
};
