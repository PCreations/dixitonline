import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildTestCard } from '../../__tests__/dataBuilders/card';
import * as Game from '../../domain/game';
import { makeCompleteHands } from '../complete-hands';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';
import { makeNullGameRepository } from '../../repos/game-repository';

describe('complete hands', () => {
  it('correctly delegates to game object the behavior and dispatch the events', async () => {
    // arrange
    const shuffledDeck = new Array(25).fill().map(() => buildTestCard().build());
    const game = buildTestGame()
      .withXPlayers(2)
      .withShuffledDeck(shuffledDeck)
      .build();
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([game])
      .build();
    const actualHandsByPlayerId = {
      [game.host.id]: new Array(6).fill().map(() => buildTestCard().build()),
      [game.players[0].id]: new Array(6).fill().map(() => buildTestCard().build()),
      [game.players[1].id]: new Array(6).fill().map(() => buildTestCard().build()),
    };
    const gameRepository = makeNullGameRepository({
      gamesData: initialGames,
    });
    const saveGameSpy = jest.spyOn(gameRepository, 'saveGame');
    const completeHandsSpy = jest.spyOn(Game, 'completeHands');
    const dispatchDomainEvents = jest.fn();
    const completeHands = makeCompleteHands({ gameRepository, dispatchDomainEvents });

    // act
    const { events, value: editedGame } = await completeHands({
      gameId: game.id,
      actualHandsByPlayerId,
      previousTurnId: 't1',
    });

    // assert
    expect(dispatchDomainEvents).toHaveBeenCalledWith(events);
    expect(saveGameSpy).toHaveBeenCalledWith(editedGame);
    expect(completeHandsSpy).toHaveBeenCalledWith(game, {
      actualHandsByPlayerId,
      previousTurnId: 't1',
    });
    expect(editedGame.cards.length).toEqual(22);
  });
});
