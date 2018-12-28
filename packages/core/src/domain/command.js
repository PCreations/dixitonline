const uuid = require('uuid/v1');

const Command = ({ type, payload }) => {
  const commandId = uuid();
  return {
    type,
    payload,
    meta: {
      commandId,
      correlationId: commandId,
      causationId: commandId,
    },
  };
};

module.exports = {
  Command,
};
