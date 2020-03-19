"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeTestServer = void 0;

var _apolloServer = require("apollo-server");

var _mergeGraphqlSchemas = require("merge-graphql-schemas");

var _ = require("..");

var _getDataSources = require("../infra/graphql/get-data-sources");

var _getContext = require("../infra/graphql/get-context");

const Query = `
  type Query
`;
const Mutation = `
  type Mutation
`;

const makeTestServer = ({
  getDataSources = (0, _getDataSources.makeGetDataSources)(),
  getContext = (0, _getContext.makeGetContext)()
} = {}) => new _apolloServer.ApolloServer({
  typeDefs: (0, _mergeGraphqlSchemas.mergeTypes)([Query, Mutation, ..._.typeDefs]),
  resolvers: _.resolvers,
  dataSources: getDataSources,
  context: getContext
});

exports.makeTestServer = makeTestServer;