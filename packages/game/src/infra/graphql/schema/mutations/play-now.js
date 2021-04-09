import { mutationField, objectType } from 'nexus';
import { ApolloError } from 'apollo-server';
import { Game } from '../game';
import { makeHandleUseCaseResult } from '../../handle-use-case-result';
import { makePlayNow } from '../../../../useCases/play-now';

export const PlayNowResult = objectType({
  name: 'GamePlayNowResult',
  definition(t) {
    t.field('game', {
      type: Game,
    });
  },
});

export const PlayNow = mutationField('gamePlayNow', {
  type: PlayNowResult,
  async resolve(_, __, { dataSources, dispatchDomainEvents, currentUser, getNowDate }) {
    const playNow = makePlayNow({ gameRepository: dataSources.gameRepository });
    const result = await playNow({ currentUser, now: getNowDate() });

    const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
    if (result.error) {
      throw new ApolloError(result.error);
    }
    return handleUseCaseResult('game');
  },
});
