/**
 * Game Scenarios Test Cases - Pure Effect Programs
 *
 * These test cases represent complete game scenarios that can run across all channels.
 * For Playwright: UI interactions for the primary player, backdoor for others.
 */

import { Effect } from 'effect';
import {
  getCardInHandByIndex,
  getCurrentStorytellerId,
  getSelectedCardsByPlayer,
} from '../../game.builder.js';
import { GameDriver } from '../../game-driver.interface.js';
import type { IdFactory } from '../test-suites/create-game.test-suite.js';

export interface TestCase<R = GameDriver> {
  readonly name: string;
  readonly program: (idFactory: IdFactory) => Effect.Effect<void, unknown, R>;
  readonly skipChannels?: ReadonlyArray<'playwright' | 'in-memory' | 'drizzle'>;
}

export const gameScenariosTestCases: ReadonlyArray<TestCase> = [
  {
    name: 'A complete game with 4 players reaching point limit',
    program: (idFactory) =>
      Effect.gen(function* () {
        let gameDriver = yield* GameDriver;
        gameDriver = gameDriver.withFailFastMode();

        const alice = idFactory.playerId('alice');
        const bob = idFactory.playerId('bob');
        const charlie = idFactory.playerId('charlie');
        const dave = idFactory.playerId('dave');
        const gameIdValue = idFactory.gameId(1);
        const deckIdValue = idFactory.deckId(1);

        // Setup: Create deck with enough cards
        yield* gameDriver.given.existingDeck({
          id: deckIdValue,
          cards: Array.from({ length: 84 }, (_, i) => `card-${i + 1}`),
        });

        // Create game with limit of 7 points (will end after ~2 turns)
        yield* gameDriver.when.creatingGame({
          gameId: gameIdValue,
          hostId: alice,
          deckId: deckIdValue,
          endCondition: {
            type: 'LimitOfPoints',
            limit: 7,
          },
        });

        // Join other players
        yield* gameDriver.when.joiningGame({
          gameId: gameIdValue,
          playerId: bob,
        });
        yield* gameDriver.when.joiningGame({
          gameId: gameIdValue,
          playerId: charlie,
        });
        yield* gameDriver.when.joiningGame({
          gameId: gameIdValue,
          playerId: dave,
        });

        // Start the game
        yield* gameDriver.when.startingGame({
          gameId: gameIdValue,
          playerId: alice,
        });

        yield* gameDriver.assert.gameToHaveBeenStarted({
          gameId: gameIdValue,
        });

        // === TURN 1 ===
        let game = yield* gameDriver.getStartedGameSnapshot(gameIdValue);
        const turn1Storyteller = getCurrentStorytellerId(game);

        // Storyteller submits clue
        yield* gameDriver.when.submittingClue({
          gameId: gameIdValue,
          playerId: turn1Storyteller,
          cardId: getCardInHandByIndex(game, {
            playerId: turn1Storyteller,
            cardIndex: 0,
          }),
          clue: 'First turn clue',
        });

        yield* gameDriver.assert.turnClueToBeSubmitted({
          gameId: gameIdValue,
          storytellerClue: 'First turn clue',
          storytellerCardId: getCardInHandByIndex(game, {
            playerId: turn1Storyteller,
            cardIndex: 0,
          }),
        });

        // Other players select cards
        const otherPlayers = [alice, bob, charlie, dave].filter(
          (p) => p !== turn1Storyteller,
        );
        for (const player of otherPlayers) {
          yield* gameDriver.when.selectingCard({
            gameId: gameIdValue,
            playerId: player,
            cardId: getCardInHandByIndex(game, {
              playerId: player,
              cardIndex: 0,
            }),
          });
        }

        yield* gameDriver.assert.turnToBeInVotingPhase({
          gameId: gameIdValue,
        });

        // Get updated game state for voting
        game = yield* gameDriver.getStartedGameSnapshot(gameIdValue);

        // Players vote (except storyteller)
        // Charlie and Dave vote for storyteller's card (they will score)
        const storytellerCard = getSelectedCardsByPlayer(game, {
          playerId: turn1Storyteller,
        })[0].cardId;
        const bobCard = getSelectedCardsByPlayer(game, {
          playerId: bob,
        })[0].cardId;

        yield* gameDriver.when.votingOnCard({
          gameId: gameIdValue,
          playerId: bob,
          cardId: storytellerCard,
        });
        yield* gameDriver.when.votingOnCard({
          gameId: gameIdValue,
          playerId: charlie,
          cardId: storytellerCard,
        });
        yield* gameDriver.when.votingOnCard({
          gameId: gameIdValue,
          playerId: dave,
          cardId: bobCard,
        });

        yield* gameDriver.assert.turnToBeInScoringPhase({
          gameId: gameIdValue,
        });

        // All players ready for next turn
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: gameIdValue,
          playerId: alice,
        });
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: gameIdValue,
          playerId: bob,
        });
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: gameIdValue,
          playerId: charlie,
        });
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: gameIdValue,
          playerId: dave,
        });

        // === TURN 2 ===
        game = yield* gameDriver.getStartedGameSnapshot(gameIdValue);
        const turn2Storyteller = getCurrentStorytellerId(game);

        yield* gameDriver.when.submittingClue({
          gameId: gameIdValue,
          playerId: turn2Storyteller,
          cardId: getCardInHandByIndex(game, {
            playerId: turn2Storyteller,
            cardIndex: 0,
          }),
          clue: 'Second turn clue',
        });

        // Other players select cards
        const otherPlayersTurn2 = [alice, bob, charlie, dave].filter(
          (p) => p !== turn2Storyteller,
        );
        for (const player of otherPlayersTurn2) {
          yield* gameDriver.when.selectingCard({
            gameId: gameIdValue,
            playerId: player,
            cardId: getCardInHandByIndex(game, {
              playerId: player,
              cardIndex: player === alice ? 0 : 1,
            }),
          });
        }

        game = yield* gameDriver.getStartedGameSnapshot(gameIdValue);

        // Voting - all vote for storyteller's card (game should end)
        const storytellerCardTurn2 = getSelectedCardsByPlayer(game, {
          playerId: turn2Storyteller,
        })[0].cardId;
        const aliceCard = getSelectedCardsByPlayer(game, {
          playerId: alice,
        })[0].cardId;

        const votersTurn2 = [alice, bob, charlie, dave].filter(
          (p) => p !== turn2Storyteller,
        );
        for (const voter of votersTurn2) {
          const cardToVote = voter === alice ? storytellerCardTurn2 : aliceCard;
          yield* gameDriver.when.votingOnCard({
            gameId: gameIdValue,
            playerId: voter,
            cardId: cardToVote,
          });
        }

        // All players ready for next turn
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: gameIdValue,
          playerId: alice,
        });
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: gameIdValue,
          playerId: bob,
        });
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: gameIdValue,
          playerId: charlie,
        });
        yield* gameDriver.when.notifyingToBeReadyForNextTurn({
          gameId: gameIdValue,
          playerId: dave,
        });

        // Game should have ended (someone reached 7 points)
        yield* gameDriver.assert.gameToBeEnded({
          gameId: gameIdValue,
        });
      }),
  },
];
