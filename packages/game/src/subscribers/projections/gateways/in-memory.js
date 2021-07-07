export const createInMemoryGameProjectionGateway = ({ projections = {} } = {}) => {
  const data = { ...projections };
  return {
    async save(projection) {
      data[projection.id] = projection;
    },
    async getGame({ gameId }) {
      return data[gameId];
    },
  };
};
