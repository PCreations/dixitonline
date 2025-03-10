import { makeSchema, queryType, mutationType } from 'nexus';
import express from 'express';
import cors from 'cors';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import { initialize as initializeDecks } from '@dixit/decks';
import { GameTypes, initialize as initializeGame } from '@dixit/game';
import { makeGameRepository } from '@dixit/game/src/repos/game-repository';
import { makeRemoveInactivePlayers as makeRemoveInactivePlayersUseCase } from '@dixit/game/src/useCases/remove-inactive-players';
import { TurnTypes, initialize as initializeTurn, turnReducer } from '@dixit/turn';
import { makeGraphqlExpressAuthorizationService } from '@dixit/users';
import { SentryPlugin } from './sentry-plugin';

const Query = queryType({
  definition() {},
});

const Mutation = mutationType({
  definition() {},
});

export default async ({
  firestore,
  firebaseAuth,
  dispatchDomainEvents,
  subscribeToDomainEvent,
  onlySubscribers = false,
}) => {
  const gameRepository = makeGameRepository({ firestore });
  const removeInactivePlayers = makeRemoveInactivePlayersUseCase({ gameRepository });

  const authorizationService = makeGraphqlExpressAuthorizationService({ firebaseAuth });
  await initializeDecks({ firestore, dispatchDomainEvents, subscribeToDomainEvent });
  const { getContext: getGameContext, getDataSources: getGameDataSources } = await initializeGame({
    firestore,
    dispatchDomainEvents,
    subscribeToDomainEvent,
    authorizationService,
  });
  const { getContext: getTurnContext, getDataSources: getTurnDataSources } = await initializeTurn({
    firestore,
    firebaseAuth,
    authorizationService,
    dispatchDomainEvents,
    subscribeToDomainEvent,
  });

  if (onlySubscribers) {
    return {
      turnReducer,
      app: null,
      removeInactivePlayers,
    };
  }

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

  app.use(async (_, __, next) => {
    try {
      await firestore
        .collection('lobby-games')
        .where('status', '==', 'WAITING_FOR_PLAYERS')
        .where('isPrivate', '==', false)
        .get()
        .then(snp => {
          const ids = [];
          snp.forEach(doc => ids.push(doc.data().id));
          console.log(`Handling ${ids.length} games`, ids);
          return Promise.all(ids.map(id => removeInactivePlayers({ gameId: id, now: new Date() })));
        });
    } catch (err) {
      console.error(err);
    }
    next();
  });
  app.use(cors({ origin: true }));

  server.applyMiddleware({ app });

  return {
    turnReducer,
    app,
    removeInactivePlayers,
  };
};
