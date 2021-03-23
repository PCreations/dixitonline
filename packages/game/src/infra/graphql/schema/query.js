import { queryField, idArg } from 'nexus';
import { Game } from './game';
import { makeGetGames } from '../../../useCases/get-games';
import { makeGetGame } from '../../../useCases/get-game';

export const Games = queryField('games', {
  list: true,
  type: Game,
  resolve(_, __, { dataSources }) {
    const getGames = makeGetGames({ gameRepository: dataSources.gameRepository });
    return getGames();
  },
});

export const GetGame = queryField('game', {
  type: Game,
  args: {
    gameId: idArg({ required: true }),
  },
  async resolve(_, { gameId }, { dataSources }) {
    const getGame = makeGetGame({ gameRepository: dataSources.gameRepository });
    const game = await getGame(gameId);
    console.log('GAME', JSON.stringify(game, null, 2));
    return game;
  },
});
