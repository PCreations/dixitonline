import { makeExecutableSchema } from 'graphql-tools';
import * as firebase from 'firebase';

import { EMAIL_ALREADY_IN_USE, WEAK_PASSWORD } from './SignupForm/model';

const config = {
  apiKey: 'AIzaSyAdpxIPnFMoFz6ePZrOXZ7PTt6KcehMk40',
  authDomain: 'dixit-af060.firebaseapp.com',
  databaseURL: 'https://dixit-af060.firebaseio.com',
  projectId: 'dixit-af060',
  storageBucket: 'dixit-af060.appspot.com',
  messagingSenderId: '409654438041',
};
firebase.initializeApp(config);

const schemaString = `
  enum SignupField {
    username
    email
    password
  }
  input SignupInputData {
    username: String!
    email: String!
    password: String!
  }
  type SignupError {
    field: SignupField!
    reason: String! #todo : reason type instead
  }
  type SignupMutationPayload {
    success: Boolean!
    errors: [SignupError]
  }
  type Query {
    toto: String
  }
  type Mutation {
    submitSignup(signupData: SignupInputData!): SignupMutationPayload
  }
`;

const resolvers = {
  Query: {
    toto() {
      return 'toto';
    },
  },
  Mutation: {
    submitSignup(root, { signupData }, context) {
      //return context.Signup.submit(signupData);
      return firebase
        .auth()
        .createUserWithEmailAndPassword(signupData.email, signupData.password)
        .then(() => ({
          success: true,
        }))
        .catch(error => {
          if (error.code == 'auth/email-already-in-use') {
            return {
              success: false,
              errors: [
                {
                  field: 'email',
                  reason: EMAIL_ALREADY_IN_USE,
                },
              ],
            };
          }
          if (error.code == 'auth/invalid-email') {
            return {
              success: false,
              errors: [
                {
                  field: 'email',
                  reason: 'auth/invalid-email',
                },
              ],
            };
          }
          if (error.code == 'auth/weak-password') {
            return {
              success: false,
              errors: [
                {
                  field: 'password',
                  reason: WEAK_PASSWORD,
                },
              ],
            };
          }
        });
    },
  },
};

const executableSchema = makeExecutableSchema({
  typeDefs: schemaString,
  resolvers,
});

export default executableSchema;
