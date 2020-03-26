import { mutationField, inputObjectType, objectType, enumType, unionType } from 'nexus';
import { GameError } from '../../../../domain/game';
import { makeStartGame } from '../../../../useCases/start-game';
import { makeHandleUseCaseResult } from '../../handle-use-case-result';

export const StartGameInput = inputObjectType({
  name: 'GameStartGameInput',
  definition(t) {
    t.id('gameId', { required: true });
  },
});

export const StartGameResultSuccess = objectType({
  name: 'GameStartGameResultSuccess',
  definition(t) {
    t.id('gameId');
  },
});

export const StartGameErrorType = enumType({
  name: 'GameStartGameErrorType',
  members: [GameError.ONLY_HOST_CAN_START_GAME, GameError.NOT_ENOUGH_PLAYERS],
});

export const StartGameResultError = objectType({
  name: 'GameStartGameResultError',
  definition(t) {
    t.field('type', {
      type: StartGameErrorType,
    });
  },
});

export const StartGameResult = unionType({
  name: 'GameStartGameResult',
  definition(t) {
    t.members(StartGameResultSuccess, StartGameResultError);
    t.resolveType(obj => (typeof obj.type === 'undefined' ? 'GameStartGameResultSuccess' : 'GameStartGameResultError'));
  },
});

export const StartGame = mutationField('gameStartGame', {
  type: StartGameResult,
  args: {
    startGameInput: StartGameInput,
  },
  async resolve(_, { startGameInput }, { dataSources, dispatchDomainEvents, currentUser }) {
    const { gameRepository } = dataSources;
    const { gameId } = startGameInput;
    const startGame = makeStartGame({ gameRepository, currentUser });
    const result = await startGame({ gameId });
    const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
    return handleUseCaseResult('gameId');
  },
});
