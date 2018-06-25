const createAuth = require('../../entities/Auth');
const userSelector = require('./userSelector');

const authSelector = store => {
  const authStoreData = store.get('auth');
  const authUserSelector = userSelector(authStoreData.authUserId);
  return createAuth({
    authenticated: authStoreData.authenticated,
    user: authUserSelector(store),
  });
};

module.exports = authSelector;