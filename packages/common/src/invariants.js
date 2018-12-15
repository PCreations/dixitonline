const invariant = require('invariant');

const ensureRequiredArgument = ({ ensureArg = args => true, errorMessage }) => args => {
  try {
    invariant(ensureArg(args), errorMessage);
    console.log(args);
    return args;
  } catch (e) {
    throw e;
  }
};

module.exports = {
  ensureRequiredArgument,
};
