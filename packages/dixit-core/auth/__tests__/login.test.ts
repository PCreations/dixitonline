import { UserRepository } from '../UserRepository';
import { User } from '../User';

describe('given a registered user with following credentials: username = julien ; password = test', () => {
  let julien: User;
  beforeAll(async () => {
    julien = await testUserRepository.getById('julien');
  });
  describe('when logging in', () => {
    beforeAll(async () => {
      await authService.login('julien', 'test');
    });
    test('then julien should be the logged in user', () => {
      expect(authService.getAuthUser()).toBe(julien);
    });
  });
});
