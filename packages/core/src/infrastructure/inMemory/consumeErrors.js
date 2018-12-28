const consumeErrors = eventEmitter => onError => eventEmitter.on('error', onError);

module.exports = {
  consumeErrors,
};
