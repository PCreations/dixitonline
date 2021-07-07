import { mutationField, unionType, objectType, enumType, inputObjectType } from 'nexus';
import { TurnPhase, mapPhaseStateToGraphQL } from '../phase';
import { TurnError } from '../../../../domain/errors';
import { makeDefineClue } from '../../../../useCases/define-clue';
import { handleUseCaseResult } from '../../handle-use-case-result';
import { viewPhaseAs } from '../../../../domain/view-phase-as';

export const DefineClueInput = inputObjectType({
  name: 'TurnDefineClueInput',
  definition(t) {
    t.id('turnId', { required: true });
    t.string('clue', { required: true });
    t.id('cardId', { required: true });
  },
});

export const DefineClueResultSuccess = objectType({
  name: 'TurnDefineClueResultSuccess',
  definition(t) {
    t.field('phase', {
      type: TurnPhase,
      resolve(turnState, _, { currentUser }) {
        return mapPhaseStateToGraphQL(viewPhaseAs(turnState, currentUser.id));
      },
    });
  },
});

export const DefineClueErrorType = enumType({
  name: 'TurnDefineClueErrorType',
  members: [TurnError.NOT_AUTHORIZED],
});

export const DefineClueResultError = objectType({
  name: 'TurnDefineClueResultError',
  definition(t) {
    t.field('type', {
      type: DefineClueErrorType,
    });
  },
});

export const DefineClueResult = unionType({
  name: 'TurnDefineClueResult',
  definition(t) {
    t.members(DefineClueResultSuccess, DefineClueResultError);
    t.resolveType(obj =>
      typeof obj.type === 'undefined' ? 'TurnDefineClueResultSuccess' : 'TurnDefineClueResultError'
    );
  },
});

export const DefineClue = mutationField('turnDefineClue', {
  type: DefineClueResult,
  args: {
    defineClueInput: DefineClueInput,
  },
  async resolve(_, { defineClueInput }, { dataSources, currentUser, dispatchDomainEvents }) {
    const defineClue = makeDefineClue({ turnRepository: dataSources.turnRepository });
    const { turnId, clue: text, cardId } = defineClueInput;
    const result = await defineClue({ playerId: currentUser.id, turnId, text, cardId });
    return handleUseCaseResult({ result, dispatchDomainEvents });
  },
});
