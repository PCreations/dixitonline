const dispatchEvents = eventEmitter => events => events.map(event => eventEmitter.emit('event', event));

module.exports = {
  dispatchEvents,
};
