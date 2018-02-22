import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { withClientState } from 'apollo-link-state';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createWebWorkerLink } from 'apollo-link-webworker';

const GraphqlWorker = require('./worker.js');

const worker = new GraphqlWorker();

const dataIdFromObject = result => result.id;

const cache = new InMemoryCache({ dataIdFromObject });

const stateLink = withClientState({
  cache,
  resolvers: {
    Mutation: {
      updateAuthStatus: (_, { isAuthenticated }, { cache }) => {
        const data = {
          authStatus: {
            __typename: 'AuthStatus',
            isAuthenticated,
          },
        };
        cache.writeData({ data });
        return null;
      },
    },
  },
  defaults: {
    authStatus: {
      __typename: 'AuthStatus',
      isAuthenticated: false,
    },
  },
});

const client = new ApolloClient({
  link: ApolloLink.from([stateLink, createWebWorkerLink({ worker })]),
  cache: new InMemoryCache(),
});

export default client;
