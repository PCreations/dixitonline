const sendCommand = eventEmitter => command => eventEmitter.emit('command', command);

module.exports = {
  sendCommand,
};
