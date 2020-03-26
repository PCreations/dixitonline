import { objectType } from 'nexus';
import { Player } from './player';
import { getAllPlayers } from '../../../domain/game';

export const Game = objectType({
  name: 'Game',
  definition(t) {
    t.id('id');
    t.field('host', { type: Player });
    t.list.field('players', {
      type: Player,
      resolve(game) {
        return getAllPlayers(game);
      },
    });
  },
});
