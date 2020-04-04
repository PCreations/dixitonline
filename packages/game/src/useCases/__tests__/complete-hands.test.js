import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildTestCard } from '../../__tests__/dataBuilders/card';
import * as Game from '../../domain/game';
import { makeCompleteHands } from '../complete-hands';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';
import { makeNullGameRepository } from '../../repos/game-repository';

describe('complete hands', () => {
  it('correctly delegates to game object the behavior and dispatch the events', async () => {
    // arrange
    const shuffledDeck = new Array(15).fill().map(() => buildTestCard().build());
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
    const fooCards = [];

    // act
    const { events, value: editedGame } = await completeHands({
      gameId: game.id,
      cards: fooCards,
      actualHandsByPlayerId,
    });

    // assert
    expect(dispatchDomainEvents).toHaveBeenCalledWith(events);
    expect(saveGameSpy).toHaveBeenCalledWith(editedGame);
    expect(completeHandsSpy).toHaveBeenCalledWith(game, { cards: fooCards, actualHandsByPlayerId });
  });
});
