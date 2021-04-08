import { objectType } from 'nexus';

export const LobbyInfos = objectType({
  name: 'GameLobbyInfos',
  definition(t) {
    t.int('waitingGames');
    t.int('connectedPlayers');
  },
});
