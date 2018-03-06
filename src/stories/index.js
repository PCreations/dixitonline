import React from 'react';
import { ApolloProvider, graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { storiesOf } from '@storybook/react';

import client from '../client';
import SignupForm from '../auth/SignupForm';

const enhance = graphql(
  gql`
    query GetAuthUser {
      authUser @client {
        id
        user {
          id
          username
          email
        }
      }
    }
  `,
  {
    props: ({ data: { loading, error, authUser } }) => {
      if (loading) {
        return { loading };
      }
      if (error) {
        return { error };
      }
      return {
        loading: false,
        authUser,
      };
    },
  },
);

const AuthUser = enhance(({ loading, error, authUser }) => {
  console.log({ loading, error, authUser });
  return error ? (
    <p>OUPS {error}</p>
  ) : loading ? (
    <p>LOADING</p>
  ) : authUser.user == null ? (
    <p>NO AUTH</p>
  ) : (
    <p>
      Auth user : {authUser.user.id}, {authUser.user.username}, {authUser.user.email}
    </p>
  );
});

storiesOf('auth / graphql integration', module).add('SignupForm', () => (
  <ApolloProvider client={client}>
    <div>
      <SignupForm />
      <AuthUser />
    </div>
  </ApolloProvider>
));
