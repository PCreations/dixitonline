import { mutationField, unionType, objectType, enumType, inputObjectType } from 'nexus';
import { TurnPhase, mapPhaseStateToGraphQL } from '../phase';
import { TurnError } from '../../../../domain/errors';
import { makeVote } from '../../../../useCases/vote';
import { handleUseCaseResult } from '../../handle-use-case-result';
import { viewPhaseAs } from '../../../../domain/view-phase-as';

export const VoteInput = inputObjectType({
  name: 'TurnVoteInput',
  definition(t) {
    t.id('turnId', { required: true });
    t.id('cardId', { required: true });
  },
});

export const VoteResultSuccess = objectType({
  name: 'TurnVoteResultSuccess',
  definition(t) {
    t.field('phase', {
      type: TurnPhase,
      resolve(turnState, _, { currentUser }) {
        console.log(turnState.turn.board);
        const result = mapPhaseStateToGraphQL(viewPhaseAs(turnState, currentUser.id)); //?
        return result;
      },
    });
  },
});

export const VoteErrorType = enumType({
  name: 'TurnVoteErrorType',
  members: [TurnError.YOU_CANT_VOTE_FOR_YOUR_OWN_CARD],
});

export const VoteResultError = objectType({
  name: 'TurnVoteResultError',
  definition(t) {
    t.field('type', {
      type: VoteErrorType,
    });
  },
});

export const VoteResult = unionType({
  name: 'TurnVoteResult',
  definition(t) {
    t.members(VoteResultSuccess, VoteResultError);
    t.resolveType(obj => (typeof obj.type === 'undefined' ? 'TurnVoteResultSuccess' : 'TurnVoteResultError'));
  },
});

export const Vote = mutationField('turnVote', {
  type: VoteResult,
  args: {
    voteInput: VoteInput,
  },
  async resolve(_, { voteInput }, { dataSources, currentUser, dispatchDomainEvents }) {
    const vote = makeVote({ turnRepository: dataSources.turnRepository });
    const { turnId, cardId } = voteInput;
    const result = await vote({ playerId: currentUser.id, turnId, cardId });
    return handleUseCaseResult({ result, dispatchDomainEvents });
  },
});
