import { greeter } from '../greeter';
import { makeCreateNewGame } from '../create-new-game';

export const resolvers = {
  Query: {
    greet(_, { name }) {
      return greeter(name);
    },
  },
  Mutation: {
    async createGame(_, __, { dataSources, dispatchDomainEvents }) {
      const createNewGame = makeCreateNewGame({ lobbyRepository: dataSources.lobbyRepository });
      const [game, domainEvents] = await createNewGame();
      dispatchDomainEvents(domainEvents);
      return {
        game,
      };
    },
  },
};
