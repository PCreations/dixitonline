import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';
import * as Game from '../../domain/game';
import { makeSetCurrentTurn } from '../set-current-turn';
import { makeNullGameRepository } from '../../repos/game-repository';

describe('update score', () => {
  it('correctly delegates to game object the behavior', async () => {
    // arrange
    const game = buildTestGame().build();
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([game])
      .build();
    const gameRepository = makeNullGameRepository({
      gamesData: initialGames,
    });
    const saveGameSpy = jest.spyOn(gameRepository, 'saveGame');
    const setCurrentTurnIdSpy = jest.spyOn(Game, 'setCurrentTurn');
    const setCurrentTurnId = makeSetCurrentTurn({ gameRepository });
    const turnId = 't1';
    const storytellerId = 'p1';

    // act
    const { value: editedGame } = await setCurrentTurnId({
      gameId: game.id,
      turnId,
      storytellerId,
    });

    // assert
    expect(saveGameSpy).toHaveBeenCalledWith(editedGame);
    expect(setCurrentTurnIdSpy).toHaveBeenCalledWith(game, { id: 't1', storytellerId: 'p1' });
  });
});
