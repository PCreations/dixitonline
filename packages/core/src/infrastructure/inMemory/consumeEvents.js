const consumeEvents = eventEmitter => onEvent => eventEmitter.addListener('event', onEvent);

module.exports = {
  consumeEvents,
};
