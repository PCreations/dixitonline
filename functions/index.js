const admin = require("firebase-admin");
const { merge, flatten } = require("lodash");
const { makeExecutableSchema } = require("graphql-tools");
const { mergeTypes } = require("merge-graphql-schemas");
const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("apollo-server-express");
const functions = require("firebase-functions");

const {
  typeDefs: Lobby,
  resolvers: lobbyResolvers,
  makeGetDataSources: makeGetLobbyDataSources,
  makeGetContext: makeGetLobbyContext
} = require("./builds/lobby");
const { makeLobbyRepository } = require("./builds/lobby/repos");
const {
  typeDefs: Game,
  resolvers: gameResolvers,
  makeGetDataSources: makeGetGameDataSources,
  makeGetContext: makeGetGameContext
} = require("./builds/game");

const firebaseApp = admin.initializeApp();

const Query = `
  type Query
`;

const Mutation = `
  type Mutation
`;

const resolvers = {};

const mergedTypeDefs = mergeTypes(flatten([Lobby, Game]), { all: true });

const getLobbyDataSources = makeGetLobbyDataSources({
  lobbyRepository: makeLobbyRepository({ firestore: firebaseApp.firestore() })
});
const getLobbyContext = makeGetLobbyContext({ dispatchDomainEvents: () => {} });
const getGameDataSources = makeGetGameDataSources();
const getGameContext = makeGetGameContext();

const schema = makeExecutableSchema({
  typeDefs: [Query, Mutation, mergedTypeDefs],
  resolvers: merge(resolvers, lobbyResolvers, gameResolvers)
});

const server = new ApolloServer({
  schema,
  dataSources: () => ({
    ...getLobbyDataSources(),
    ...getGameDataSources()
  }),
  context: async (...args) => ({
    ...(await getLobbyContext(...args)),
    ...(await getGameContext(...args))
  })
});

const app = express();
app.use(cors({ origin: true }));

server.applyMiddleware({ app });

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.api = functions.https.onRequest(app);
