import { ApolloServer } from 'apollo-server';
import { makeNullGraphqlExpressAuthorizationService } from '@dixit/users';

export const createMakeTestServer = ({ schema, getContext }) => ({
  getDataSources,
  dispatchDomainEvents = () => {},
  currentUserId = '',
  currentUserUsername = '',
} = {}) =>
  new ApolloServer({
    schema,
    dataSources: getDataSources,
    context: getContext({
      dispatchDomainEvents,
      authorizationService: makeNullGraphqlExpressAuthorizationService({
        userIdInDecodedToken: currentUserId,
        currentUserUsername,
      }),
    }),
  });
