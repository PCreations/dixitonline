const consumeCommands = eventEmitter => onCommand => eventEmitter.addListener('command', onCommand);

module.exports = {
  consumeCommands,
};
