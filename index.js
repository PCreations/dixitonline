import path from 'path';
import { EventEmitter } from 'events';
import { makeSchema, queryType, mutationType } from 'nexus';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { initialize as initializeDecks } from '@dixit/decks';
import { GameTypes, initialize as initializeGame } from '@dixit/game';
import { TurnTypes, initialize as initializeTurn } from '@dixit/turn';
import { makeGraphqlExpressAuthorizationService } from '@dixit/users';

const eventEmitter = new EventEmitter();
const dispatchDomainEvents = events => events.map(event => eventEmitter.emit(event.type, event));
const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);

const Query = queryType({
  definition() {},
});

const Mutation = mutationType({
  definition() {},
});

export default ({ firestore, firebaseAuth }) => {
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
    outputs: {
      schema: path.join(__dirname, './schema.gen.graphql'),
    },
  });

  const server = new ApolloServer({
    schema,
    dataSources: () => ({
      ...getGameDataSources(),
      ...getTurnDataSources(),
    }),
    context: async (...args) => ({
      ...(await getGameContext(...args)),
      ...(await getTurnContext(...args)),
    }),
  });

  const app = express();
  app.use(cors({ origin: true }));

  server.applyMiddleware({ app });

  return app;
};
