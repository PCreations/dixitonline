import { queryField, idArg } from 'nexus';
import { Game } from './game';
import { makeGetGames } from '../../../useCases/get-games';
import { makeGetGame } from '../../../useCases/get-game';
import { GameStatus } from '../../../domain/game';
import { makeRemoveInactivePlayers } from '../../../useCases/remove-inactive-players';

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
  async resolve(_, { gameId }, { dataSources, getNowDate }) {
    const getGame = makeGetGame({ gameRepository: dataSources.gameRepository, getNowDate });
    const removeInactivePlayers = makeRemoveInactivePlayers({ gameRepository: dataSources.gameRepository });
    let game = await getGame(gameId);

    if (game.status === GameStatus.WAITING_FOR_PLAYERS) {
      const result = await removeInactivePlayers({ gameId: game.id, now: getNowDate() });
      game = result.value;
    }

    return game;
  },
});
