import { makeLobbyRepository } from './lobby-repository';

export const makeGetDataSources = ({ lobbyRepository = makeLobbyRepository() } = {}) => () => ({
  lobbyRepository,
});
