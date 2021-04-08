import { queryField, idArg } from 'nexus';
import { Game } from './game';
import { LobbyInfos } from './lobby-infos';
import { makeGetGames } from '../../../useCases/get-games';
import { makeGetGame } from '../../../useCases/get-game';
import { makeGetLobbyInfos } from '../../../useCases/get-lobby-infos';

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
  async resolve(_, { gameId }, { dataSources, getNowDate, currentUser }) {
    const getGame = makeGetGame({ gameRepository: dataSources.gameRepository, getNowDate });
    const game = await getGame(gameId, currentUser);

    return game;
  },
});

export const GetLobbyInfos = queryField('lobbyInfos', {
  type: LobbyInfos,
  async resolve(_, __, { dataSources }) {
    const getLobbyInfos = makeGetLobbyInfos({ gameRepository: dataSources.gameRepository });

    return getLobbyInfos();
  },
});
