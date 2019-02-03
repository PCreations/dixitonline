const consumeErrors = eventEmitter => onError => eventEmitter.on('customError', onError);

module.exports = {
  consumeErrors,
};
