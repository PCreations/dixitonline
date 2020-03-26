import { objectType } from 'nexus';

export const Player = objectType({
  name: 'GamePlayer',
  definition(t) {
    t.id('id');
    t.string('name');
  },
});
