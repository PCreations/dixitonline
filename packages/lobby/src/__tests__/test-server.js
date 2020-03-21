import { ApolloServer } from 'apollo-server';
import { mergeTypes } from 'merge-graphql-schemas';
import { makeNullGraphqlExpressAuthorizationService } from '@dixit/users';
import { typeDefs, resolvers } from '..';
import { makeGetDataSources } from '../infra/graphql/get-data-sources';
import { makeGetContext } from '../infra/graphql/get-context';

const Query = `
  type Query
`;

const Mutation = `
  type Mutation
`;

export const makeTestServer = ({
  getDataSources = makeGetDataSources(),
  dispatchDomainEvents = () => {},
  currentUserId = '',
  currentUserUsername = '',
} = {}) =>
  new ApolloServer({
    typeDefs: mergeTypes([Query, Mutation, ...typeDefs]),
    resolvers,
    dataSources: getDataSources,
    context: makeGetContext({
      dispatchDomainEvents,
      authorizationService: makeNullGraphqlExpressAuthorizationService({
        userIdInDecodedToken: currentUserId,
        currentUserUsername,
      }),
    }),
  });
