import { mutationField } from 'nexus';
import { makeCreateNewGame } from '../../../../useCases/create-new-game';
import { makePlayer } from '../../../../domain/player';
import { makeHandleUseCaseResult } from '../../handle-use-case-result';
import { CreateGameResult } from './create-game';

export const CreatePublicGame = mutationField('gameCreatePublicGame', {
  type: CreateGameResult,
  async resolve(_, __, { dataSources, dispatchDomainEvents, currentUser, getNowDate }) {
    const createNewGame = makeCreateNewGame({ gameRepository: dataSources.gameRepository });
    const result = await createNewGame(
      makePlayer({ id: currentUser.id, name: currentUser.username, heartbeat: getNowDate() }),
      undefined,
      { isPublic: true }
    );
    const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
    return handleUseCaseResult('game');
  },
});
