import path from 'path';
import { ApolloServer } from 'apollo-server';
import { makeSchema, queryType, mutationType } from 'nexus';
import { makeNullGraphqlExpressAuthorizationService } from '@dixit/users';
import * as types from '../infra/graphql/schema';
import { makeGetDataSources } from '../infra/graphql/get-data-sources';
import { makeGetContext } from '../infra/graphql/get-context';

const Query = queryType({
  definition() {},
});

const Mutation = mutationType({
  definition() {},
});

const schema = makeSchema({
  types: { Query, Mutation, ...types },
  outputs: {
    schema: path.join(__dirname, './game-schema.gen.graphql'),
  },
});

export const makeTestServer = ({
  getDataSources = makeGetDataSources(),
  dispatchDomainEvents = () => {},
  currentUserId = '',
  currentUserUsername = '',
} = {}) =>
  new ApolloServer({
    schema,
    dataSources: getDataSources,
    context: makeGetContext({
      dispatchDomainEvents,
      authorizationService: makeNullGraphqlExpressAuthorizationService({
        userIdInDecodedToken: currentUserId,
        currentUserUsername,
      }),
    }),
  });
