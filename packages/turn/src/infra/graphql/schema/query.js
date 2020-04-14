import { queryField, idArg } from 'nexus';
import { makeGetTurnPhase } from '../../../useCases/get-turn-phase';
import { TurnPhase, mapPhaseStateToGraphQL } from './phase';

export const GetTurnPhase = queryField('getTurnPhase', {
  type: TurnPhase,
  args: {
    turnId: idArg({ required: true }),
  },
  async resolve(_, { turnId }, { dataSources, currentUser }) {
    if (!currentUser) {
      throw new Error('unauthorized');
    }
    const getTurnPhase = makeGetTurnPhase({ turnRepository: dataSources.turnRepository });
    const turn = await getTurnPhase({ turnId, playerId: currentUser.id });
    return mapPhaseStateToGraphQL(turn);
  },
});
