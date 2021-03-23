import { ApolloServer } from 'apollo-server';
import { makeNullGraphqlExpressAuthorizationService } from '@dixit/users';

export const createMakeTestServer = ({ schema, getContext }) => ({
  getDataSources,
  dispatchDomainEvents = () => {},
  currentUserId = '',
  currentUserUsername = '',
  getNowDate = () => new Date('2021-04-04'),
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
      getNowDate,
    }),
  });
