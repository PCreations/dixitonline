import { mutationField, inputObjectType, enumType, unionType, objectType } from 'nexus';
import { Game } from '../game';
import { GameError } from '../../../../domain/game';
import { makeQuitGame } from '../../../../useCases/quit-game';
import { makeHandleUseCaseResult } from '../../handle-use-case-result';

export const QuitGameInput = inputObjectType({
  name: 'GameQuitGameInput',
  definition(t) {
    t.id('gameId', { required: true });
  },
});

export const QuitGameResultSuccess = objectType({
  name: 'GameQuitGameResultSuccess',
  definition(t) {
    t.field('game', { type: Game });
  },
});

export const QuitGameErrorType = enumType({
  name: 'GameQuitGameErrorType',
  members: [GameError.GAME_ALREADY_JOINED, GameError.MAXIMUM_NUMBER_OF_PLAYERS_REACHED],
});

export const QuitGameResultError = objectType({
  name: 'GameQuitGameResultError',
  definition(t) {
    t.field('type', {
      type: QuitGameErrorType,
    });
  },
});

export const QuitGameResult = unionType({
  name: 'GameQuitGameResult',
  definition(t) {
    t.members(QuitGameResultSuccess, QuitGameResultError);
    t.resolveType(obj => (typeof obj.type === 'undefined' ? 'GameQuitGameResultSuccess' : 'GameQuitGameResultError'));
  },
});

export const QuitGame = mutationField('gameQuitGame', {
  type: QuitGameResult,
  args: {
    quitGameInput: QuitGameInput,
  },
  async resolve(_, { quitGameInput }, { dataSources, dispatchDomainEvents, currentUser }) {
    const { gameId } = quitGameInput;
    const quitGame = makeQuitGame({ gameRepository: dataSources.gameRepository });
    const result = await quitGame({ gameId, currentUser });
    const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
    return handleUseCaseResult('game');
  },
});
