import { mutationField, unionType, objectType, enumType, inputObjectType } from 'nexus';
import { TurnPhase, mapPhaseStateToGraphQL } from '../phase';
import { TurnError } from '../../../../domain/errors';
import { makeChoseCard } from '../../../../useCases/chose-card';
import { handleUseCaseResult } from '../../handle-use-case-result';
import { viewPhaseAs } from '../../../../domain/view-phase-as';

export const ChoseCardInput = inputObjectType({
  name: 'TurnChoseCardInput',
  definition(t) {
    t.id('turnId', { required: true });
    t.id('cardId', { required: true });
  },
});

export const ChoseCardResultSuccess = objectType({
  name: 'TurnChoseCardResultSuccess',
  definition(t) {
    t.field('phase', {
      type: TurnPhase,
      resolve(turnState, _, { currentUser }) {
        return mapPhaseStateToGraphQL(viewPhaseAs(turnState, currentUser.id));
      },
    });
  },
});

export const ChoseCardErrorType = enumType({
  name: 'TurnChoseCardErrorType',
  members: [TurnError.NOT_AUTHORIZED],
});

export const ChoseCardResultError = objectType({
  name: 'TurnChoseCardResultError',
  definition(t) {
    t.field('type', {
      type: ChoseCardErrorType,
    });
  },
});

export const ChoseCardResult = unionType({
  name: 'TurnChoseCardResult',
  definition(t) {
    t.members(ChoseCardResultSuccess, ChoseCardResultError);
    t.resolveType(obj => (typeof obj.type === 'undefined' ? 'TurnChoseCardResultSuccess' : 'TurnChoseCardResultError'));
  },
});

export const ChoseCard = mutationField('turnChoseCard', {
  type: ChoseCardResult,
  args: {
    choseCardInput: ChoseCardInput,
  },
  async resolve(_, { choseCardInput }, { dataSources, currentUser, dispatchDomainEvents }) {
    const choseCard = makeChoseCard({ turnRepository: dataSources.turnRepository });
    const { turnId, cardId } = choseCardInput;
    const result = await choseCard({ playerId: currentUser.id, turnId, cardId });
    return handleUseCaseResult({ result, dispatchDomainEvents });
  },
});
