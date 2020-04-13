import { objectType } from 'nexus';

export const Player = objectType({
  name: 'GamePlayer',
  definition(t) {
    t.id('id');
    t.string('name');
    t.int('score', {
      resolve(player) {
        return player.score ?? 0;
      },
    });
  },
});
