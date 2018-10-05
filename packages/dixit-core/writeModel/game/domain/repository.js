const invariant = require('invariant');
const { withParams } = require('dixit-utils');

const Repository = withParams(['aggregateReducer', 'aggregateName'], ({ aggregateReducer, aggregateName }) =>
  withParams(
    ['eventStore', 'dispatchEvents'],
    ({ eventStore: { getEventsForAggregate, saveEventsForAggregate }, dispatchEvents }) => {
      return {
        async get(id) {
          invariant(typeof id !== 'undefined', 'must provide an id');
          const events = await getEventsForAggregate({ name: aggregateName, id });
          invariant(events.length > 0, `${aggregateName} with id "${id}" not found`);
          dispatchEvents(events);
          return events.reduce(aggregateReducer, { id });
        },
        async save({ id, events }) {
          invariant(typeof id !== 'undefined', `undefined id when trying to save ${aggregateName} aggregate`);
          invariant(
            Array.isArray(events),
            `events to be saved must be an array, received instead : ${events}`,
          );
          try {
            await saveEventsForAggregate({ name: aggregateName, id, events });
            dispatchEvents(events);
          } catch (e) {
            console.error(e);
            throw new Error(`${aggregateName} can't be saved`, e);
          }
        },
      };
    },
  ),
);

module.exports = {
  Repository,
};
