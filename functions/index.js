const admin = require('firebase-admin');
const path = require('path');
const { makeSchema, queryType, mutationType } = require('nexus');
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const functions = require('firebase-functions');

const {
  GameTypes,
  makeGetDataSources: makeGetGameDataSources,
  makeGetContext: makeGetGameContext,
} = require('./builds/game');
const { makeGameRepository } = require('./builds/game/repos');
const { makeNullGraphqlExpressAuthorizationService } = require('./builds/users');

const firebaseApp = admin.initializeApp();

const Query = queryType({
  definition() {},
});

const Mutation = mutationType({
  definition() {},
});

const getGameDataSources = makeGetGameDataSources({
  lobbyRepository: makeGameRepository({ firestore: firebaseApp.firestore() }),
});
const getGameContext = ({ req }) => {
  return makeGetGameContext({
    dispatchDomainEvents: () => {},
    authorizationService: makeNullGraphqlExpressAuthorizationService({
      token: 'token',
      userIdInDecodedToken: req.headers['test-user-id'],
      currentUserUsername: req.headers['test-username'],
    }),
  })({ req });
};

const schema = makeSchema({
  types: { Query, Mutation, ...GameTypes },
  outputs: {
    schema: path.join(__dirname, './schema.gen.graphql'),
  },
});

const server = new ApolloServer({
  schema,
  dataSources: () => ({
    ...getGameDataSources(),
  }),
  context: async (...args) => ({
    ...(await getGameContext(...args)),
  }),
});

const app = express();
app.use(cors({ origin: true }));

server.applyMiddleware({ app });

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.api = functions.https.onRequest(app);
