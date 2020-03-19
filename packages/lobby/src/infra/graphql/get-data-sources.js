import { makeLobbyRepository } from '../../repos/lobby-repository';

export const makeGetDataSources = ({ lobbyRepository = makeLobbyRepository() } = {}) => () => ({
  lobbyRepository,
});
