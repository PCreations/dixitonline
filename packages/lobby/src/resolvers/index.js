import { greeter } from '../greeter';

export const resolvers = {
  Query: {
    greet(_, { name }) {
      return greeter(name);
    },
  },
};
