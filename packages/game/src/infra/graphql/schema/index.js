import { queryType, mutationType } from 'nexus';

export const Query = queryType({
  definition() {},
});

export const Mutation = mutationType({
  definition() {},
});

export * from './mutations';
export * from './game';
export * from './player';
export * from './query';
