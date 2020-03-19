import { makeGetDataSources } from './get-data-sources';
import { makeGetContext } from './get-context';

export { resolvers } from './resolvers';
export { typeDefs } from './typeDefs';
export const getDataSources = makeGetDataSources();
export const getContext = makeGetContext();
