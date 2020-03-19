import * as path from 'path';
import { fileLoader } from 'merge-graphql-schemas';

export const typeDefs = fileLoader(path.join(__dirname, './'));
