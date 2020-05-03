import { buildTestGame } from '../../__tests__/dataBuilders/game';
import * as Game from '../../domain/game';
import { makeHandleTurnEnded } from '../handle-turn-ended';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';
import { makeNullGameRepository } from '../../repos/game-repository';
import { buildTestCard } from '../../../../turn/src/__tests__/dataBuilders/card';

describe('handle turn ended', () => {
  it('correctly delegates to game object the behavior of updateDeck, completeHands and updateScore', async () => {
    // arrange
    const game = buildTestGame()
      .withXPlayers(2)
      .withCards(48)
      .withScore([1, 2, 3])
      .build();
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([game])
      .build();
    const discardedCards = new Array(3).fill().map(() => buildTestCard().build());
    const dispatchDomainEvents = jest.fn();
    const actualHandsByPlayerId = [];
    const gameRepository = makeNullGameRepository({
      gamesData: initialGames,
    });
    const saveGameSpy = jest.spyOn(gameRepository, 'saveGame');
    const updateDeckSpy = jest.spyOn(Game, 'updateDeck');
    const updateScoreSpy = jest.spyOn(Game, 'updateScore');
    const completeHandsSpy = jest.spyOn(Game, 'completeHands');
    const handleTurnEnded = makeHandleTurnEnded({ gameRepository, dispatchDomainEvents });
    const turnScore = {
      [game.host.id]: 2,
      [game.players[0].id]: 1,
      [game.players[1].id]: 5,
    };
    const gameWithUpdatedScore = Game.makeGame({
      ...game,
      score: {
        [game.host.id]: 3,
        [game.players[0].id]: 3,
        [game.players[1].id]: 8,
      },
    });
    const gameWithUpdatedDeck = Game.makeGame({
      ...gameWithUpdatedScore,
      drawPile: discardedCards,
    });

    // act
    const { value: editedGame, events } = await handleTurnEnded({
      gameId: game.id,
      actualHandsByPlayerId,
      previousTurnId: 't1',
      turnScore,
      discardedCards,
    });

    // assert
    expect(updateScoreSpy).toHaveBeenCalledWith(game, turnScore);
    expect(updateDeckSpy).toHaveBeenCalledWith(gameWithUpdatedScore, { discardedCards });
    expect(completeHandsSpy).toHaveBeenCalledWith(gameWithUpdatedDeck, { actualHandsByPlayerId, previousTurnId: 't1' });
    expect(saveGameSpy).toHaveBeenCalledWith(editedGame);
    expect(dispatchDomainEvents).toHaveBeenCalledWith(events);
  });
});
