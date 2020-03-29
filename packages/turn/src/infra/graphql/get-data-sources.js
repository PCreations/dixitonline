import { makeTurnRepository } from '../../repos/turn-repository';

export const makeGetDataSources = ({ turnRepository = makeTurnRepository() } = {}) => () => ({
  turnRepository,
});
