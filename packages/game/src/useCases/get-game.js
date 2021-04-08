export const makeGetGame = ({ gameRepository, getNowDate }) => async (gameId, currentUser) => {
  const game = await gameRepository.getGameById(gameId);
  await gameRepository.savePlayerHeartbeat({ playerId: currentUser.id, gameId, heartbeat: getNowDate() });

  // if (currentUser.id === game.host.id) {
  //   const heartbeats = await gameRepository.getGamePlayersHeartbeats(game.id);
  //   console.log(
  //     JSON.stringify(
  //       {
  //         players: [game.host, ...game.players],
  //         heartbeats,
  //       },
  //       null,
  //       2
  //     )
  //   );
  // }
  return game;
};
