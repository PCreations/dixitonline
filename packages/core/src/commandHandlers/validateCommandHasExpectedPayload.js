const validateCommandHasExpectedPayload = (command = {}, ...expectedPayloadProperties) => {
  invariant(
    typeof command.payload !== 'undefined',
    `Missing propert${
      expectedPayloadProperties.length === 1 ? 'y' : 'ies'
    } in payload : ${expectedPayloadProperties.join(', ')}`,
  );
  const missingProperties = expectedPayloadProperties.filter(
    expectedProp => typeof command.payload[expectedProp] === 'undefined',
  );
  invariant(
    missingProperties.length === 0,
    `Missing propert${missingProperties.length === 1 ? 'y' : 'ies'} in payload : ${missingProperties.join(
      ', ',
    )}`,
  );
};

module.exports = {
  validateCommandHasExpectedPayload,
};
