import { queryField } from 'nexus';
import { Game } from './game';
import { makeGetGames } from '../../../useCases/get-games';

export const Games = queryField('games', {
  list: true,
  type: Game,
  resolve(_, __, { dataSources }) {
    const getGames = makeGetGames({ gameRepository: dataSources.gameRepository });
    return getGames();
  },
});
