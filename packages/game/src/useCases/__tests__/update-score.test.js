import { buildTestGame } from '../../__tests__/dataBuilders/game';
import * as Game from '../../domain/game';
import { makeUpdateScore } from '../update-score';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';
import { makeNullGameRepository } from '../../repos/game-repository';

describe('update score', () => {
  it('correctly delegates to game object the behavior', async () => {
    // arrange
    const game = buildTestGame()
      .withXPlayers(2)
      .withScore()
      .build();
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([game])
      .build();
    const gameRepository = makeNullGameRepository({
      gamesData: initialGames,
    });
    const saveGameSpy = jest.spyOn(gameRepository, 'saveGame');
    const updateScoreSpy = jest.spyOn(Game, 'updateScore');
    const updateScore = makeUpdateScore({ gameRepository });
    const turnScore = {
      [game.host.id]: 2,
      [game.players[0].id]: 1,
      [game.players[1].id]: 5,
    };

    // act
    const { value: editedGame } = await updateScore({
      gameId: game.id,
      turnScore,
    });

    // assert
    expect(saveGameSpy).toHaveBeenCalledWith(editedGame);
    expect(updateScoreSpy).toHaveBeenCalledWith(game, turnScore);
  });
});
