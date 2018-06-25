import createDixitEngine, { connectorsFactory, entitiesFactory } from 'dixit-core';
import * as firebase from 'firebase';

const config = {
  apiKey: 'AIzaSyArBfdmU4-qgQG_0PEAykQjfYQIUq3_snQ',
  authDomain: 'dixit-test.firebaseapp.com',
  databaseURL: 'https://dixit-test.firebaseio.com',
  projectId: 'dixit-test',
  storageBucket: 'dixit-test.appspot.com',
  messagingSenderId: '482948825396',
};
firebase.initializeApp(config);

const authConnector = connectorsFactory.createAuthConnector({
  authRequest: async ({ username, email, password }) => {
    const firebaseUser = await firebase.auth().createUserWithEmailAndPassword(email, password);
    firebaseUser.updateProfile({
      displayName: username,
    });
    return entitiesFactory.createUser({
      id: firebaseUser.uid(),
      username,
      email,
    });
  },
  isWeakPasswordError(err) {
    return err.code === 'auth/weak-password';
  },
  isEmailAlreadyInUseError(err) {
    return err.code === 'auth/email-already-in-use';
  },
  authState({ userDidSignIn, userDidSignOut }) {
    firebase.auth().onAuthStateChanged(user => (user === null ? userDidSignOut() : userDidSignIn()));
  },
});

/*

gameConnector: {

}

*/

const dixitEngine = createDixitEngine({
  authConnector,
});

export default dixitEngine;
