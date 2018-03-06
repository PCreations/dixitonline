import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider, graphql } from 'react-apollo';
import gql from 'graphql-tag';

import client from './client';
import SignupForm from './auth/SignupForm';

const enhance = graphql(
  gql`
    query GetAuthUser {
      authUser @client {
        id
        username
        email
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
  ) : authUser == null ? (
    <p>NO AUTH</p>
  ) : (
    <p>
      Auth user : {authUser.id}, {authUser.username}, {authUser.email}
    </p>
  );
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <div>
      <SignupForm />
      <AuthUser />
    </div>
  </ApolloProvider>,
  document.getElementById('root'),
);
