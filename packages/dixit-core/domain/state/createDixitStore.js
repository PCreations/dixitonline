const { Record, Map } = require('immutable');

const defaultStore = Map({
  auth: Map({
    authenticated: false,
    authUserId: null,
  }),
  users: Map(),
});

const DixitStore = Record(defaultStore);

const createDixitStore = store => new DixitStore(store);

module.exports = createDixitStore;
