import { makeSchema, queryType, mutationType } from 'nexus';
import express from 'express';
import cors from 'cors';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import { initialize as initializeDecks } from '@dixit/decks';
import { GameTypes, initialize as initializeGame } from '@dixit/game';
import { makeGameRepository } from '@dixit/game/src/repos/game-repository';
import { makeRemoveInactivePlayers as makeRemoveInactivePlayersUseCase } from '@dixit/game/src/useCases/remove-inactive-players';
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
  const gameRepository = makeGameRepository({ firestore });
  const removeInactivePlayers = makeRemoveInactivePlayersUseCase({ gameRepository });

  setInterval(async () => {
    console.log('RUNNING REMOVE INACTIVE PLAYERS');
    const gameIds = await firestore
      .collection('lobby-games')
      .where('status', '==', 'WAITING_FOR_PLAYERS')
      .get()
      .then(snp => {
        const ids = [];
        snp.forEach(doc => ids.push(doc.data().id));
        return ids;
      });
    console.log(`Handling ${gameIds.length} games`);
    await Promise.all(gameIds.map(id => removeInactivePlayers({ gameId: id, now: new Date() })));
  }, 10000);

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
      console.log('CURRENT TIME', new Date());
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

  return {
    app,
    removeInactivePlayers,
  };
};
