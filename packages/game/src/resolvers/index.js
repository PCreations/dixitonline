export const resolvers = {
  Query: {
    game(_, { id }) {
      if (id === 42) {
        return 'Game42';
      }
      return 'NotFoundGame';
    },
  },
};
