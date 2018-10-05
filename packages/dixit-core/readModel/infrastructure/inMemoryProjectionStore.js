const { EventEmitter } = require('events');
const { ProjectionStore } = require('../domain/projectionStore');

const InMemoryProjectionStore = () => {
  const projections = {};
  const projectionsUpdatesEmitter = new EventEmitter();
  return ProjectionStore({
    async saveProjection({ name, projection }) {
      projections[name] = projection;
      projectionsUpdatesEmitter.emit(name, projection);
    },
    async getProjection(name) {
      return projections[name];
    },
    projectionsUpdatesEmitter,
  });
};

module.exports = {
  InMemoryProjectionStore,
};
