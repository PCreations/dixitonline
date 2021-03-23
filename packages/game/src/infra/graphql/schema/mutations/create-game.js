import { mutationField, objectType } from 'nexus';
import { Game } from '../game';
import { makeCreateNewGame } from '../../../../useCases/create-new-game';
import { makePlayer } from '../../../../domain/player';
import { makeHandleUseCaseResult } from '../../handle-use-case-result';

export const CreateGameResult = objectType({
  name: 'GameCreateGameResult',
  definition(t) {
    t.field('game', {
      type: Game,
    });
  },
});

export const CreateGame = mutationField('gameCreateGame', {
  type: CreateGameResult,
  async resolve(_, __, { dataSources, dispatchDomainEvents, currentUser, getNowDate }) {
    const createNewGame = makeCreateNewGame({ gameRepository: dataSources.gameRepository });
    const result = await createNewGame(
      makePlayer({ id: currentUser.id, name: currentUser.username, heartbeat: getNowDate() })
    );
    const handleUseCaseResult = makeHandleUseCaseResult({ dispatchDomainEvents, result });
    return handleUseCaseResult('game');
  },
});
