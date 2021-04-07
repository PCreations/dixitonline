import { objectType, enumType, unionType } from 'nexus';
import { Player } from './player';
import { getAllPlayers, getEndCondition, GameStatus as DomainGameStatus } from '../../../domain/game';

export const GameStatus = enumType({
  name: 'GameStatus',
  members: DomainGameStatus,
});

export const RemainingTurnsEndCondition = objectType({
  name: 'GameRemainingTurnsEndCondition',
  definition(t) {
    t.int('remainingTurns');
  },
});

export const ScoreLimitEndCondition = objectType({
  name: 'GameScoreLimitEndCondition',
  definition(t) {
    t.int('scoreLimit');
  },
});

export const GameEndCondition = unionType({
  name: 'GameEndCondition',
  definition(t) {
    t.members(RemainingTurnsEndCondition, ScoreLimitEndCondition);
    t.resolveType(obj =>
      typeof obj.remainingTurns === 'undefined' ? 'GameScoreLimitEndCondition' : 'GameRemainingTurnsEndCondition'
    );
  },
});

export const Game = objectType({
  name: 'Game',
  definition(t) {
    t.id('id');
    t.field('host', { type: Player });
    t.boolean('isPrivate');
    t.field('status', { type: GameStatus });
    t.id('currentTurnId', {
      nullable: true,
      resolve({ currentTurn }) {
        return currentTurn.id;
      },
    });
    t.int('remainingTurns', {
      deprecation: 'use endCondition instead',
    });
    t.field('endCondition', {
      type: GameEndCondition,
      resolve(game) {
        console.log(getEndCondition(game));
        return getEndCondition(game);
      },
    });
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
