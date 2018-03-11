const test = require('tape');

const createUser = require('../User');

test('createUser should create an objet with the given username and id prop', assert => {
  const user = createUser({ username: 'foo', id: '42' });
  assert.equal(user.username, 'foo', 'username should be foo');
  assert.equal(user.id, '42', 'id should be 42');
  assert.end();
});

test('createUser should create an immutable User entity', assert => {
  const user = createUser({ username: 'foo' });
  const tryToMutateUser = user => {
    user.username = 'bar';
  };
  assert.throws(tryToMutateUser.bind(null, user));
  assert.end();
});
