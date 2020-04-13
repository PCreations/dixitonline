import admin from 'firebase-admin';
import * as serviceAccount from '../../secrets/dixit-firebase-admin.json';
import { makeUserRepository, makeNullUserRepository } from '../user-repository';

describe('user repository', () => {
  it('can retrieve a user by id', async () => {
    // arrange
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://dixit-af060.firebaseio.com',
    });
    const userRepository = makeUserRepository({ firebaseAuth: admin.auth() });

    // act
    const user = await userRepository.getUserById('PThWfbR8ZGP1DL5l0434QJScETz2');

    // assert
    expect(user).toEqual({
      id: 'PThWfbR8ZGP1DL5l0434QJScETz2',
      name: 'Pierre Criulanscy',
    });
  });
});
describe('null user repository', () => {
  it('can retrieve a user by id', async () => {
    // arrange
    const users = {
      PThWfbR8ZGP1DL5l0434QJScETz2: {
        displayName: 'pcriulan',
      },
    };
    const userRepository = makeNullUserRepository({ users });

    // act
    const user = await userRepository.getUserById('PThWfbR8ZGP1DL5l0434QJScETz2');

    // assert
    expect(user).toEqual({
      id: 'PThWfbR8ZGP1DL5l0434QJScETz2',
      name: 'pcriulan',
    });
  });
});
