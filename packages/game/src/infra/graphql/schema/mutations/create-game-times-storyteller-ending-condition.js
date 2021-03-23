import { mutationField, objectType, inputObjectType, enumType, unionType } from 'nexus';
import { Game } from '../game';
import { makeCreateNewGame } from '../../../../useCases/create-new-game';
import { makePlayer } from '../../../../domain/player';
import { GameError } from '../../../../domain/game';
import { makeHandleUseCaseResult } from '../../handle-use-case-result';

export const CreateGameWithXtimesStorytellerEndingConditionError = enumType({
  name: 'GameCreateGameWithXtimesStorytellerEndingConditionError',
  members: [GameError.X_TIMES_STORYTELLER_CANT_BE_LESS_THAN_ONE],
});

export const CreateGameWithXtimesStorytellerEndingConditionResultError = objectType({
  name: 'GameCreateGameWithXtimesStorytellerEndingConditionResultError',
  definition(t) {
    t.field('type', {
      type: CreateGameWithXtimesStorytellerEndingConditionError,
    });
  },
});

export const CreateGameWithXtimesStorytellerEndingConditionResultSuccess = objectType({
  name: 'GameCreateGameWithXtimesStorytellerEndingConditionResultSuccess',
  definition(t) {
    t.field('game', {
      type: Game,
    });
  },
});

export const CreateGameWithXtimesStorytellerEndingConditionResult = unionType({
  name: 'GameCreateGameWithXtimesStorytellerEndingConditionResult',
  definition(t) {
    t.members(
      CreateGameWithXtimesStorytellerEndingConditionResultSuccess,
      CreateGameWithXtimesStorytellerEndingConditionResultError
    );
    t.resolveType(obj =>
      typeof obj.type === 'undefined'
        ? 'GameCreateGameWithXtimesStorytellerEndingConditionResultSuccess'
        : 'GameCreateGameWithXtimesStorytellerEndingConditionResultError'
    );
  },
});

export const CreateGameWithXtimesStorytellerEndingConditionInput = inputObjectType({
  name: 'GameCreateGameWithXtimesStorytellerEndingConditionInput',
  definition(t) {
    t.int('timesBeingStoryteller');
  },
});

export const CreateGameWithXtimesStorytellerEndingCondition = mutationField(
  'gameCreateGameWithXtimesStorytellerEndingCondition',
  {
    type: CreateGameWithXtimesStorytellerEndingConditionResult,
    args: {
      createGameWithXtimesStorytellerEndingConditionInput: CreateGameWithXtimesStorytellerEndingConditionInput,
    },
    async resolve(
      _,
      { createGameWithXtimesStorytellerEndingConditionInput },
      { dataSources, dispatchDomainEvents, currentUser, getNowDate }
    ) {
      const createNewGame = makeCreateNewGame({ gameRepository: dataSources.gameRepository });
      const result = await createNewGame(
        makePlayer({ id: currentUser.id, name: currentUser.username, heartbeat: getNowDate() }),
        {
          xTimesStorytellerLimit: createGameWithXtimesStorytellerEndingConditionInput.timesBeingStoryteller,
        }
      );
      const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
      return handleUseCaseResult('game');
    },
  }
);
