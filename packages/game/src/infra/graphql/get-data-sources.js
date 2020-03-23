import { makeGameRepository } from '../../repos/game-repository';

export const makeGetDataSources = ({ gameRepository = makeGameRepository() } = {}) => () => ({
  gameRepository,
});
