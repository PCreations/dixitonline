import { makeGame } from '../../domain/game';

export const buildLobbyRepositoryInitialGames = () => {
  let initialGames = {};
  return {
    withGames(games = [makeGame()]) {
      initialGames = games.reduce(
        (data, game) => ({
          ...data,
          [game.id]: game,
        }),
        {}
      );
      return this;
    },
    build() {
      return initialGames;
    },
  };
};
