import { mutationField, objectType, inputObjectType, enumType, unionType } from 'nexus';
import { Game } from '../game';
import { makeCreateNewGame } from '../../../../useCases/create-new-game';
import { makePlayer } from '../../../../domain/player';
import { GameError } from '../../../../domain/game';
import { makeHandleUseCaseResult } from '../../handle-use-case-result';

export const CreateGameWithScoreLimitEndingConditionError = enumType({
  name: 'GameCreateGameWithScoreLimitEndingConditionError',
  members: [GameError.SCORE_LIMIT_CANT_BE_LESS_THAN_ONE],
});

export const CreateGameWithScoreLimitEndingConditionResultError = objectType({
  name: 'GameCreateGameWithScoreLimitEndingConditionResultError',
  definition(t) {
    t.field('type', {
      type: CreateGameWithScoreLimitEndingConditionError,
    });
  },
});

export const CreateGameWithScoreLimitEndingConditionResultSuccess = objectType({
  name: 'GameCreateGameWithScoreLimitEndingConditionResultSuccess',
  definition(t) {
    t.field('game', {
      type: Game,
    });
  },
});

export const CreateGameWithScoreLimitEndingConditionResult = unionType({
  name: 'GameCreateGameWithScoreLimitEndingConditionResult',
  definition(t) {
    t.members(CreateGameWithScoreLimitEndingConditionResultSuccess, CreateGameWithScoreLimitEndingConditionResultError);
    t.resolveType(obj =>
      typeof obj.type === 'undefined'
        ? 'GameCreateGameWithScoreLimitEndingConditionResultSuccess'
        : 'GameCreateGameWithScoreLimitEndingConditionResultError'
    );
  },
});

export const CreateGameWithScoreLimitEndingConditionInput = inputObjectType({
  name: 'GameCreateGameWithScoreLimitEndingConditionInput',
  definition(t) {
    t.int('scoreLimit');
  },
});

export const CreateGameWithScoreLimitEndingCondition = mutationField('gameCreateGameWithScoreLimitEndingCondition', {
  type: CreateGameWithScoreLimitEndingConditionResult,
  args: {
    createGameWithScoreLimitEndingConditionInput: CreateGameWithScoreLimitEndingConditionInput,
  },
  async resolve(
    _,
    { createGameWithScoreLimitEndingConditionInput },
    { dataSources, dispatchDomainEvents, currentUser }
  ) {
    console.log({ currentUser });
    const createNewGame = makeCreateNewGame({ gameRepository: dataSources.gameRepository });
    const result = await createNewGame(makePlayer({ id: currentUser.id, name: currentUser.username }), {
      scoreLimit: createGameWithScoreLimitEndingConditionInput.scoreLimit,
    });
    const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
    return handleUseCaseResult('game');
  },
});
