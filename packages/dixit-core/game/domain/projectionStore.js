const { fromEvent, merge, from } = require('rxjs');
const { filter } = require('rxjs/operators');

const ProjectionStore = ({ saveProjection, getProjection, projectionsUpdatesEmitter }) => {
  const lobby$ = merge(from(getProjection('lobby')), fromEvent(projectionsUpdatesEmitter, 'lobby')).pipe(
    filter(lobby => typeof lobby !== 'undefined'),
  );
  return {
    lobby: {
      async save({ gamesList }) {
        debugger;
        return saveProjection({ name: 'lobby', projection: { gamesList } });
      },
      $: lobby$,
    },
  };
};

module.exports = {
  ProjectionStore,
};
