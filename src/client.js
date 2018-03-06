import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { withClientState } from 'apollo-link-state';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import gql from 'graphql-tag';

import firestoreConnector from './firestoreConnector';

import AuthModel from './auth';
import { EMAIL_ALREADY_IN_USE, WEAK_PASSWORD } from './auth/model';

const Auth = AuthModel(firestoreConnector);

const cache = new InMemoryCache();

const stateLink = withClientState({
  cache,
  resolvers: {
    Query: {
      authUser: (_, args, { cache }) => {
        const user = Auth.currentUser();
        return (
          user && {
            id: user.uid,
            username: user.displayName,
            email: user.email,
            __typename: 'User',
          }
        );
      },
    },
    Mutation: {
      submitSignup: async (_, { signupData }, { cache }) => {
        try {
          await Auth.signup(signupData);
          return {
            success: true,
            errors: [],
            __typename: 'SignupMutationPayload',
          };
        } catch (error) {
          if (error.code == 'auth/email-already-in-use') {
            return {
              success: false,
              errors: [
                {
                  field: 'email',
                  reason: EMAIL_ALREADY_IN_USE,
                  __typename: 'SignupError',
                },
              ],
              __typename: 'SignupMutationPayload',
            };
          }
          if (error.code == 'auth/invalid-email') {
            return {
              success: false,
              errors: [
                {
                  field: 'email',
                  reason: 'auth/invalid-email',
                  __typename: 'SignupError',
                },
              ],
              __typename: 'SignupMutationPayload',
            };
          }
          if (error.code == 'auth/weak-password') {
            return {
              success: false,
              errors: [
                {
                  field: 'password',
                  reason: WEAK_PASSWORD,
                  __typename: 'SignupError',
                },
              ],
              __typename: 'SignupMutationPayload',
            };
          }
        }
      },
    },
  },
});

const client = new ApolloClient({
  link: stateLink,
  cache,
});

Auth.authStateChange$
  .map(
    user =>
      user === null
        ? null
        : {
            id: user.uid,
            username: user.displayName,
            email: user.email,
          },
  )
  .do(authUser => console.log('AUTH USER', authUser))
  .subscribe(authUser => {
    const data = {
      authUser: authUser && {
        ...authUser,
        __typename: 'User',
      },
    };
    const cacheObj = cache.extract();
    console.log('WRITTING DATA', data);
    client.writeQuery({
      query: gql`
        query GetAuthUser {
          authUser @client {
            id
            username
            email
          }
        }
      `,
      data,
    });
    const cacheObjAfter = cache.extract();
    console.log('after');
  });

export default client;
