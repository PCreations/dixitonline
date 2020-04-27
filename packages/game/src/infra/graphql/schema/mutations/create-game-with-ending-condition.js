import { mutationField, objectType, inputObjectType } from 'nexus';
import { Game } from '../game';
import { makeCreateNewGame } from '../../../../useCases/create-new-game';
import { makePlayer } from '../../../../domain/player';
import { makeHandleUseCaseResult } from '../../handle-use-case-result';

export const CreateGameWithEndingConditionResult = objectType({
  name: 'GameCreateGameWithEndingConditionResult',
  definition(t) {
    t.field('game', {
      type: Game,
    });
  },
});

export const CreateGameWithEndingConditionInput = inputObjectType({
  name: 'GameCreateGameWithEndingConditionInput',
  definition(t) {
    t.int('timesBeingStoryteller');
  },
});

export const CreateGameWithEndingCondition = mutationField('gameCreateGameWithEndingCondition', {
  type: CreateGameWithEndingConditionResult,
  args: {
    createGameWithEndingConditionInput: CreateGameWithEndingConditionInput,
  },
  async resolve(_, { createGameWithEndingConditionInput }, { dataSources, dispatchDomainEvents, currentUser }) {
    console.log({ currentUser });
    const createNewGame = makeCreateNewGame({ gameRepository: dataSources.gameRepository });
    const result = await createNewGame(makePlayer({ id: currentUser.id, name: currentUser.username }), {
      xTimesStorytellerEndCondition: createGameWithEndingConditionInput.timesBeingStoryteller,
    });
    const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
    return handleUseCaseResult('game');
  },
});
