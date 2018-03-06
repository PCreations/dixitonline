import * as firebase from 'firebase';
import 'firebase/firestore';
import { Observable } from 'rxjs';

import createConnector from './createConnector';

const config = {
  apiKey: 'AIzaSyArBfdmU4-qgQG_0PEAykQjfYQIUq3_snQ',
  authDomain: 'dixit-test.firebaseapp.com',
  databaseURL: 'https://dixit-test.firebaseio.com',
  projectId: 'dixit-test',
  storageBucket: 'dixit-test.appspot.com',
  messagingSenderId: '482948825396',
};

firebase.initializeApp(config);

firebase.auth().onAuthStateChanged(user => console.log('FIREBASE USER', user && user.displayName));

const authStateChange$ = Observable.fromEventPattern(handler =>
  firebase.auth().onAuthStateChanged(handler),
).do(user => console.log('OBS FIREBASE USER', user));

const createUserAndLogin = async ({ username, email, password }) => {
  try {
    const user = await firebase.auth().createUserWithEmailAndPassword(email, password);
    await user.updateProfile({
      displayName: username,
    });
    await user.reload();
  } catch (e) {
    throw e;
  }
};

export default createConnector({
  auth: {
    authStateChange$,
    createUserAndLogin,
    currentAuthUser() {
      return firebase.auth().currentUser;
    },
  },
});
