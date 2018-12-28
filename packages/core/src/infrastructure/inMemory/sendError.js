const sendError = eventEmitter => error => eventEmitter.emit('error', error);

module.exports = {
  sendError,
};
