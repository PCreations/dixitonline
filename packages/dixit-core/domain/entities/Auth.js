const { Record } = require('immutable');

const createUser = require('./User');

const Auth = Record({ authenticated: false, user: createUser({}) });

module.exports = props => new Auth(props);
