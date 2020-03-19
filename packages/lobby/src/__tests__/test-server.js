import { ApolloServer } from 'apollo-server';
import { mergeTypes } from 'merge-graphql-schemas';
import { typeDefs, resolvers } from '..';
import { makeGetDataSources } from '../get-data-sources';
import { makeGetContext } from '../get-context';

const Query = `
  type Query
`;

const Mutation = `
  type Mutation
`;

export const makeServer = ({ getDataSources = makeGetDataSources(), getContext = makeGetContext() } = {}) =>
  new ApolloServer({
    typeDefs: mergeTypes([Query, Mutation, ...typeDefs]),
    resolvers,
    dataSources: getDataSources,
    context: getContext,
  });
