import { objectType } from 'nexus';

export const Card = objectType({
  name: 'TurnCard',
  definition(t) {
    t.id('id');
    t.string('url');
  },
});
