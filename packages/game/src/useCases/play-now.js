import { getAllPlayers, isGameFull } from '../domain/game';
import { makePlayer } from '../domain/player';
import { makeCreateNewGame } from './create-new-game';
import { makeJoinGame } from './join-game';

export const makePlayNow = ({ gameRepository }) => async ({ currentUser, now }) => {
  const currentUserNotInGame = game => getAllPlayers(game).find(p => p.id === currentUser.id) === undefined;

  const notFull = game => !isGameFull(game);

  const logGames = label => games => {
    console.log({ [label]: games });
    return games;
  };

  const publicGamesWaitingForPlayers = await gameRepository
    .getPublicGamesWaitingForPlayers()
    .then(logGames('publicGamesWaitingForPlayers'))
    .then(games => games.filter(currentUserNotInGame))
    .then(logGames('currentUserNotInGame'))
    .then(games => games.filter(notFull))
    .then(logGames('notFullGames'));

  if (publicGamesWaitingForPlayers.length === 0) {
    const createNewGame = makeCreateNewGame({ gameRepository });
    const host = makePlayer({ id: currentUser.id, name: currentUser.username });

    return createNewGame(host, undefined, { isPublic: true });
  }

  publicGamesWaitingForPlayers.sort((g1, g2) => getAllPlayers(g2).length - getAllPlayers(g1).length);

  const joinGame = makeJoinGame({ gameRepository });
  return joinGame({ gameId: publicGamesWaitingForPlayers[0].id, currentUser, now });
};
