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
      context.dispatchDomainEvents([
        { type: '[lobby] - a new player has joined a game', payload: { playerId: 'p2', gameId: 'g1' } },
      ]);
      return {
        game: {
          id: 'g1',
          host: {
            id: 'p1',
            name: 'player1',
          },
          players: [
            {
              id: 'p2',
              name: 'player2',
            },
          ],
        },
      };
    },
  },
};
