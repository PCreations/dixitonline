/*global expect*/
const createUser = require('../User');

describe('User entity', () => {
  test('createUser should create an objet with the given username and id prop', () => {
    const user = createUser({ username: 'foo', id: '42' });
    expect(user.username).toBe('foo');
    expect(user.id).toBe('42');
  });

  test('createUser should create an immutable User entity', () => {
    const user = createUser({ username: 'foo' });
    const tryToMutateUser = user => {
      user.username = 'bar';
    };
    expect(tryToMutateUser.bind(null, user)).toThrow();
  });
});
