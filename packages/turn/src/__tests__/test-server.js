import path from 'path';
import { makeSchema, queryType, mutationType } from 'nexus';
import { createMakeTestServer } from '@dixit/shared/src/testUtils';
import * as types from '../infra/graphql/schema';
import { makeGetContext } from '../infra/graphql/get-context';

const Query = queryType({
  definition() {},
});

const Mutation = mutationType({
  definition() {},
});

const schema = makeSchema({
  types: { Query, Mutation, ...types },
  outputs: {
    schema: path.join(__dirname, './turn-schema.gen.graphql'),
  },
});

export const makeTestServer = createMakeTestServer({ schema, getContext: makeGetContext });
