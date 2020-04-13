import { objectType, enumType } from 'nexus';
import { Player } from './player';
import { getAllPlayers, GameStatus as DomainGameStatus } from '../../../domain/game';

export const GameStatus = enumType({
  name: 'GameStatus',
  members: DomainGameStatus,
});

export const Game = objectType({
  name: 'Game',
  definition(t) {
    t.id('id');
    t.field('host', { type: Player });
    t.field('status', { type: GameStatus });
    t.id('currentTurnId', {
      nullable: true,
      resolve({ currentTurn }) {
        return currentTurn.id;
      },
    });
    t.int('remainingTurns');
    t.list.field('players', {
      type: Player,
      resolve(game) {
        const { score } = game;
        const players = getAllPlayers(game).map(player => {
          return {
            ...player,
            score: score[player.id],
          };
        });
        return players;
      },
    });
  },
});
