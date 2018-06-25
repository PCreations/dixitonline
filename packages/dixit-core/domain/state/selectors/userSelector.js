const createUser = require('../../entities/User');

const userSelector = store => userId => {
  const userStoreData = store.getIn(['users', userId]);
  return createUser(userStoreData);
};

module.exports = userSelector;
