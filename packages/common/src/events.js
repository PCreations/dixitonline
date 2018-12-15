const uuid = require('uuid/v1');

const Event = ({ type, payload = {} }) => ({
  type,
  payload,
  meta: {
    eventId: uuid(),
    __isAnEvent__: true,
    __isLocal__: false,
    __localTimestamp__: +new Date(), // useful for optimistic update
  },
});

const isEvent = maybeEvent => maybeEvent && maybeEvent.meta && maybeEvent.meta.__isAnEvent__ === true;
const isLocalEvent = maybeEvent => isEvent(maybeEvent) && maybeEvent.meta.__isLocal__ === true;

const asLocalEvent = event => ({
  ...event,
  meta: {
    ...event.meta,
    __isLocal__: true,
  },
});

const withAggregateMeta = ({ aggregateName, aggregateId }) => event => ({
  ...event,
  meta: {
    ...event.meta,
    aggregateName,
    aggregateId: aggregateId(event),
  },
});

module.exports = {
  Event,
  isEvent,
  asLocalEvent,
  isLocalEvent,
  withAggregateMeta,
};
