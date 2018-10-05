const curry = require('lodash/fp/curry');
const invariant = require('invariant');

const withParams = curry((requiredParamsName, fn) => {
  invariant(
    Array.isArray(requiredParamsName),
    `invalid requiredParams, expected arrays but received ${requiredParamsName} instead`,
  );
  if (process.env.NODE_ENV === 'production') {
    return fn;
  }
  const fnWithRequiredParams = (params = {}) => {
    invariant(params, `missing parameters, received ${params}`);
    let isParamsAnObject = true;
    let paramsKeys;
    try {
      paramsKeys = Object.keys(params);
    } catch (e) {
      isParamsAnObject = false;
    }
    invariant(
      isParamsAnObject,
      `invalid params, expected object with keys ${requiredParamsName.join(', ')} but got ${params} instead`,
    );
    requiredParamsName.forEach(param => {
      invariant(paramsKeys.includes(param), `missing mandatory argument ${param}`);
      invariant(typeof params[param] !== 'undefined', `param ${param} should be defined`);
    });
    return fn(params);
  };
  return fnWithRequiredParams;
});

module.exports = {
  withParams,
};
