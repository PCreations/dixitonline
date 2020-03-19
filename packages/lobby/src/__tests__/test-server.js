import { ApolloServer } from 'apollo-server';
import { mergeTypes } from 'merge-graphql-schemas';
import { typeDefs, resolvers } from '..';
import { makeGetDataSources } from '../infra/graphql/get-data-sources';
import { makeGetContext } from '../infra/graphql/get-context';

const Query = `
  type Query
`;

const Mutation = `
  type Mutation
`;

export const makeTestServer = ({ getDataSources = makeGetDataSources(), getContext = makeGetContext() } = {}) =>
  new ApolloServer({
    typeDefs: mergeTypes([Query, Mutation, ...typeDefs]),
    resolvers,
    dataSources: getDataSources,
    context: getContext,
  });
