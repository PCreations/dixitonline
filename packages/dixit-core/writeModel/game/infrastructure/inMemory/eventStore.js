const { Map } = require('immutable');
const { EventStore } = require('../../domain/eventStore');

const InMemoryEventStore = ({ history = [], dispatchEvents } = {}) => {
  let _events = Map(
    history.reduce((streamsMap, event) => {
      const streamName = `${event.meta.aggregateName}-${event.meta.aggregateId}`;
      return {
        ...streamsMap,
        [streamName]: (streamsMap[streamName] || []).concat(event),
      };
    }, {}),
  );
  return {
    ...EventStore({
      async getEventsForStreamName({ streamName }) {
        return _events.get(streamName, []);
      },
      async saveEventsForStreamName({ streamName, events }) {
        _events = _events.update(streamName, evts => evts.concat(events));
      },
    }),
    replayHistory() {
      if (history.length > 0) {
        dispatchEvents(history);
      }
    },
  };
};

module.exports = {
  InMemoryEventStore,
};
