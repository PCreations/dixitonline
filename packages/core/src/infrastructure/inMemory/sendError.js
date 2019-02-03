const sendError = eventEmitter => error => eventEmitter.emit('customError', error);

module.exports = {
  sendError,
};
