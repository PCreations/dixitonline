const invariant = require('invariant');
const { isLocalEvent } = require('./events');

// TODO : handle optimistic concurrency here
const saveAggregateEvents = ({ saveEvents, getCurrentAggregateVersion }) => async ({
  expectedAggregateVersion,
  events,
}) => {
  invariant(Array.isArray(events), 'events must be an array, received instead :', events);
  try {
    const currentAggregateVersion = await getCurrentAggregateVersion();
    if (currentAggregateVersion !== expectedAggregateVersion) throw currentAggregateVersion;
  } catch (badCurrentAggregateVersionOrError) {
    if (typeof badCurrentAggregateVersionOrError === typeof new Error()) {
      throw badCurrentAggregateVersionOrError;
    }
    throw new Error(
      `[concurrency issue] : expected version ${expectedAggregateVersion} but the current aggregate version is ${badCurrentAggregateVersionOrError}`,
    );
  }
  return saveEvents(events.filter(event => !isLocalEvent(event)));
};

module.exports = {
  saveAggregateEvents,
};
