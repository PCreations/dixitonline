import { makeCreateNewGame } from '../../../useCases/create-new-game';
import { makeGetGames } from '../../../useCases/get-games';
import { makePlayer } from '../../../domain/player';

export const resolvers = {
  Query: {
    lobbyGames(_, __, { dataSources }) {
      const getGames = makeGetGames({ lobbyRepository: dataSources.lobbyRepository });
      return getGames();
    },
  },
  Mutation: {
    async lobbyCreateGame(_, __, { dataSources, dispatchDomainEvents }) {
      const createNewGame = makeCreateNewGame({ lobbyRepository: dataSources.lobbyRepository });
      const [game, domainEvents] = await createNewGame(makePlayer({ id: 'p1', name: 'player1' }));
      dispatchDomainEvents(domainEvents);
      return {
        game,
      };
    },
  },
};
