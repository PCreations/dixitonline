const { Record } = require('immutable');

const UserRecord = Record({ username: null, id: null });

module.exports = userProps => new UserRecord(userProps);
