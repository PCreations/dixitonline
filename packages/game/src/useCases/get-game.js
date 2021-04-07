import { makeGame } from '../domain/game';
import { makePlayer } from '../domain/player';

export const makeGetGame = ({ gameRepository, getNowDate }) => async gameId => {
  const game = await gameRepository.getGameById(gameId);

  const updatedGame = makeGame({
    ...game,
    host: makePlayer({
      ...game.host,
      heartbeat: getNowDate(),
    }),
  });
  await gameRepository.saveGame(updatedGame);
  return updatedGame;
};
