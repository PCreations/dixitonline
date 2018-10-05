const { withParams } = require('dixit-utils');

const Event = withParams(
  ['type', 'payload', 'aggregateName', 'aggregateId'],
  ({ type, payload, aggregateName, aggregateId }) => ({
    type,
    payload,
    meta: {
      timestamp: +new Date(),
      aggregateName,
      aggregateId,
    },
  }),
);

module.exports = {
  Event,
};
