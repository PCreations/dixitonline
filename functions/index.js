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
  getDataSources: getLobbyDataSources
} = require("./builds/lobby");
const {
  typeDefs: Game,
  resolvers: gameResolvers,
  getDataSources: getGameDataSources
} = require("./builds/game");

const Query = `
  type Query
`;

const Mutation = `
  type Mutation
`;

const resolvers = {};

const mergedTypeDefs = mergeTypes(flatten([Lobby, Game]), { all: true });

const schema = makeExecutableSchema({
  typeDefs: [Query, Mutation, mergedTypeDefs],
  resolvers: merge(resolvers, lobbyResolvers, gameResolvers),
  dataSources: () => ({
    ...getLobbyDataSources(),
    ...getGameDataSources()
  })
});

const server = new ApolloServer({
  schema
});

const app = express();
app.use(cors({ origin: true }));

server.applyMiddleware({ app });

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.api = functions.https.onRequest(app);
