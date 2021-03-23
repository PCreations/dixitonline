import { mutationField, inputObjectType, enumType, unionType, objectType } from 'nexus';
import { Game } from '../game';
import { GameError } from '../../../../domain/game';
import { makeJoinGame } from '../../../../useCases/join-game';
import { makeHandleUseCaseResult } from '../../handle-use-case-result';

export const JoinGameInput = inputObjectType({
  name: 'GameJoinGameInput',
  definition(t) {
    t.id('gameId', { required: true });
  },
});

export const JoinGameResultSuccess = objectType({
  name: 'GameJoinGameResultSuccess',
  definition(t) {
    t.field('game', { type: Game });
  },
});

export const JoinGameErrorType = enumType({
  name: 'GameJoinGameErrorType',
  members: [GameError.GAME_ALREADY_JOINED, GameError.MAXIMUM_NUMBER_OF_PLAYERS_REACHED],
});

export const JoinGameResultError = objectType({
  name: 'GameJoinGameResultError',
  definition(t) {
    t.field('type', {
      type: JoinGameErrorType,
    });
  },
});

export const JoinGameResult = unionType({
  name: 'GameJoinGameResult',
  definition(t) {
    t.members(JoinGameResultSuccess, JoinGameResultError);
    t.resolveType(obj => (typeof obj.type === 'undefined' ? 'GameJoinGameResultSuccess' : 'GameJoinGameResultError'));
  },
});

export const JoinGame = mutationField('gameJoinGame', {
  type: JoinGameResult,
  args: {
    joinGameInput: JoinGameInput,
  },
  async resolve(_, { joinGameInput }, { dataSources, dispatchDomainEvents, currentUser, getNowDate }) {
    const { gameId } = joinGameInput;
    const joinGame = makeJoinGame({ gameRepository: dataSources.gameRepository });
    const result = await joinGame({ gameId, currentUser, now: getNowDate() });
    const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
    return handleUseCaseResult('game');
  },
});
