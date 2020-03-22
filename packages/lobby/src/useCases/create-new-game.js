import { createGame } from '../domain/game';

export const makeCreateNewGame = ({ lobbyRepository }) => async host => {
  const gameId = lobbyRepository.getNextGameId();

  const result = createGame({ gameId, host });

  if (!result.error) {
    await lobbyRepository.saveGame(result.value);
  }

  return result;
};
