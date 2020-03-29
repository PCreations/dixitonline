import { mutationField, unionType, objectType, enumType, inputObjectType } from 'nexus';
import { TurnPhase } from '../../../../domain/turn';

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
    t.string('clue');
  },
});

export const DefineClueErrorType = enumType({
  name: 'TurnDefineClueErrorType',
  members: ['TO_BE_DEFINED'],
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
  async resolve(_, { defineClueInput }, { dataSources }) {
    const turn = await dataSources.turnRepository.getTurnById(defineClueInput.turnId);
    const editedTurn = {
      ...turn,
      phase: TurnPhase.PLAYERS_CARD_CHOICE,
    };
    await dataSources.turnRepository.saveTurn(editedTurn);
    return {
      clue: defineClueInput.clue,
    };
  },
});
