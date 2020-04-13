import { makeSchema, queryType, mutationType } from 'nexus';
import express from 'express';
import cors from 'cors';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import { initialize as initializeDecks } from '@dixit/decks';
import { GameTypes, initialize as initializeGame } from '@dixit/game';
import { TurnTypes, initialize as initializeTurn } from '@dixit/turn';
import { makeGraphqlExpressAuthorizationService } from '@dixit/users';
import { SentryPlugin } from './sentry-plugin';

const Query = queryType({
  definition() {},
});

const Mutation = mutationType({
  definition() {},
});

export default ({ firestore, firebaseAuth, dispatchDomainEvents, subscribeToDomainEvent }) => {
  const authorizationService = makeGraphqlExpressAuthorizationService({ firebaseAuth });
  initializeDecks({ firestore, dispatchDomainEvents, subscribeToDomainEvent });
  const { getContext: getGameContext, getDataSources: getGameDataSources } = initializeGame({
    firestore,
    dispatchDomainEvents,
    subscribeToDomainEvent,
    authorizationService,
  });
  const { getContext: getTurnContext, getDataSources: getTurnDataSources } = initializeTurn({
    firestore,
    firebaseAuth,
    authorizationService,
    dispatchDomainEvents,
    subscribeToDomainEvent,
  });

  const schema = makeSchema({
    types: { Query, Mutation, ...GameTypes, ...TurnTypes },
  });

  const server = new ApolloServer({
    schema,
    plugins: [SentryPlugin],
    dataSources: () => ({
      ...getGameDataSources(),
      ...getTurnDataSources(),
    }),
    context: async (...args) => {
      const [context] = args;
      if (context.req?.body.operationName !== 'IntrospectionQuery') {
        try {
          return {
            ...(await getGameContext(...args)),
            ...(await getTurnContext(...args)),
          };
        } catch (e) {
          if (e.message === 'unauthorized') {
            throw new AuthenticationError();
          }
        }
      }
    },
  });

  const app = express();
  app.use(cors({ origin: true }));

  server.applyMiddleware({ app });

  return app;
};
