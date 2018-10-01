const invariant = require('invariant');
const { withParams } = require('../../utils/withParams');

const EventStore = ({ getEventsForStreamName, saveEventsForStreamName }) => {
  const getStreamName = withParams(['name', 'id'], ({ name, id }) => `${name}-${id}`);
  return {
    getEventsForAggregate: withParams(['name', 'id'], async ({ name, id }) => {
      invariant(typeof name !== 'undefined', 'must provide an aggregate name');
      invariant(typeof id !== 'undefined', `must provide an aggregate id for aggregate ${name}`);
      const streamName = getStreamName({ name, id });
      return getEventsForStreamName({ streamName });
    }),
    saveEventsForAggregate: withParams(['name', 'id', 'events'], async ({ name, id, events }) => {
      invariant(typeof name !== 'undefined', 'must provide an aggregate name');
      invariant(typeof id !== 'undefined', 'must provide an aggregate id');
      const streamName = getStreamName({ name, id });
      return saveEventsForStreamName({ streamName, events });
    }),
  };
};

module.exports = {
  EventStore,
};
